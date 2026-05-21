const axios = require("axios");
const fs = require("fs");
const path = require("path");
const env = require("../src/config/env");
const { getCache, setCache, buildCacheKey } = require("./cacheService");

const LOCATION_CACHE_TTL = 10 * 60 * 1000;

const facilitiesPath = path.join(__dirname, "..", "data", "healthFacilities.json");
let cachedFacilities = null;

function normalizeText(value = "") {
  return String(value).trim().toLowerCase();
}

function toTitleCase(value = "") {
  return String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function loadFacilities() {
  if (!cachedFacilities) {
    const raw = fs.readFileSync(facilitiesPath, "utf8");
    cachedFacilities = JSON.parse(raw);
  }

  return cachedFacilities;
}

function getKnownLocations() {
  const facilities = loadFacilities();
  const locations = facilities.map((facility) => normalizeText(facility.location));
  return [...new Set(locations)].filter(Boolean);
}

function extractLocationFromText(text) {
  const normalizedText = normalizeText(text);

  if (!normalizedText) {
    return null;
  }

  const knownLocations = getKnownLocations();

  for (const location of knownLocations) {
    if (normalizedText === location || normalizedText.includes(` ${location}`) || normalizedText.includes(location)) {
      return {
        type: "text",
        label: toTitleCase(location),
        query: location,
      };
    }
  }

  const phraseMatch = normalizedText.match(/\b(?:i(?:'| a)?m|i am|in|at|around|near|from)\s+([a-z0-9\s'-]+)$/i);
  if (phraseMatch) {
    const candidate = normalizeText(phraseMatch[1]);
    for (const location of knownLocations) {
      if (candidate === location || candidate.includes(location) || location.includes(candidate)) {
        return {
          type: "text",
          label: toTitleCase(location),
          query: location,
        };
      }
    }

    return {
      type: "text",
      label: toTitleCase(candidate),
      query: candidate,
    };
  }

  return null;
}

function extractLocationContext(input = {}) {
  if (typeof input === "string") {
    return extractLocationFromText(input);
  }

  const locationPayload = input.location || input.coordinates || input.locationMessage || null;
  if (locationPayload) {
    const latitude = Number(locationPayload.latitude ?? locationPayload.lat ?? locationPayload.degreesLatitude);
    const longitude = Number(locationPayload.longitude ?? locationPayload.lng ?? locationPayload.lon ?? locationPayload.degreesLongitude);
    const label = normalizeText(locationPayload.name || locationPayload.address || input.locationName || "");

    if (label || Number.isFinite(latitude) || Number.isFinite(longitude)) {
      return {
        type: Number.isFinite(latitude) && Number.isFinite(longitude) ? "coordinates" : "text",
        label: label ? toTitleCase(label) : (Number.isFinite(latitude) && Number.isFinite(longitude) ? `${latitude}, ${longitude}` : "shared location"),
        coordinates: Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null,
        raw: locationPayload,
      };
    }
  }

  return extractLocationFromText(input.text || input.message || "");
}

function isFacilityRequest(text = "") {
  const normalizedText = normalizeText(text);

  return /\b(hospital near me|nearby hospital|nearby clinic|health facility near me|nearest hospital|nearest clinic|clinic in|hospital in|where can i go|where do i go|find a facility|find a clinic|find a hospital)\b/i.test(
    normalizedText
  );
}

function isDirectionsRequest(text = "") {
  const normalizedText = normalizeText(text);

  return /\b(directions|get directions|route|how do i get there)\b/i.test(normalizedText);
}

function hasGoogleMapsKey() {
  return Boolean(env.GOOGLE_MAPS_API_KEY);
}

async function getCoordinates(locationName) {
  const query = String(locationName || "").trim();
  const cacheKey = buildCacheKey("location-coordinates", query.toLowerCase());

  const cachedCoordinates = getCache(cacheKey);
  if (cachedCoordinates) {
    return cachedCoordinates;
  }

  if (!query) {
    return null;
  }

  if (!hasGoogleMapsKey()) {
    return null;
  }

  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          address: query,
          key: env.GOOGLE_MAPS_API_KEY,
        },
      }
    );

    if (response.data?.status === "ZERO_RESULTS") {
      return null;
    }

    if (response.data?.status !== "OK") {
      throw new Error(response.data?.error_message || response.data?.status || "Geocoding failed");
    }

    const result = response.data?.results?.[0];
    const latitude = result?.geometry?.location?.lat;
    const longitude = result?.geometry?.location?.lng;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    const resolvedLocation = {
      latitude,
      longitude,
      formattedAddress: result.formatted_address || toTitleCase(query),
      placeId: result.place_id || null,
    };

    setCache(cacheKey, resolvedLocation, LOCATION_CACHE_TTL);
    return resolvedLocation;

  } catch (error) {
    console.error("[locationService] Google geocoding failed:", error.message);
    throw new Error("Failed to resolve location");
  }
}

async function getNearbyHospitals(latitude, longitude) {
  const cacheKey = buildCacheKey("nearby-hospitals", latitude, longitude);
  const cachedHospitals = getCache(cacheKey);

  if (cachedHospitals) {
    return cachedHospitals;
  }

  if (!hasGoogleMapsKey()) {
    return [];
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return [];
  }

  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
      {
        params: {
          location: `${latitude},${longitude}`,
          radius: 5000,
          type: "hospital",
          key: env.GOOGLE_MAPS_API_KEY,
        },
      }
    );

    if (response.data?.status === "ZERO_RESULTS") {
      return [];
    }

    if (response.data?.status !== "OK") {
      throw new Error(response.data?.error_message || response.data?.status || "Places search failed");
    }

    const hospitals = (response.data?.results || []).slice(0, 5).map((hospital) => {
      const hospitalLatitude = hospital?.geometry?.location?.lat ?? null;
      const hospitalLongitude = hospital?.geometry?.location?.lng ?? null;

      return {
        name: hospital.name || "Unknown hospital",
        address: hospital.vicinity || hospital.formatted_address || "",
        location: {
          latitude: Number.isFinite(hospitalLatitude) ? hospitalLatitude : null,
          longitude: Number.isFinite(hospitalLongitude) ? hospitalLongitude : null,
        },
        mapsUrl:
          Number.isFinite(hospitalLatitude) && Number.isFinite(hospitalLongitude)
            ? `https://www.google.com/maps?q=${hospitalLatitude},${hospitalLongitude}`
            : `https://www.google.com/maps?q=${latitude},${longitude}`,
        placeId: hospital.place_id || null,
      };
    });

    setCache(cacheKey, hospitals, LOCATION_CACHE_TTL);
    return hospitals;
  } catch (error) {
    console.error("[locationService] Google nearby hospital lookup failed:", error.message);
    throw new Error("Failed to find nearby hospitals");
  }
}

function formatDirectionsResponse(hospitals, locationLabel = "") {
  const safeLabel = locationLabel ? ` near ${locationLabel}` : "";

  if (!Array.isArray(hospitals) || hospitals.length === 0) {
    return [
      `I couldn't find nearby hospitals${safeLabel}. Please try again with a clearer location.`,
      "If this is urgent, please go immediately to the nearest hospital.",
    ].join("\n");
  }

  const lines = hospitals.map((hospital, index) => {
    const latitude = hospital?.location?.latitude;
    const longitude = hospital?.location?.longitude;
    const mapsUrl =
      hospital.mapsUrl ||
      (Number.isFinite(latitude) && Number.isFinite(longitude)
        ? `https://www.google.com/maps?q=${latitude},${longitude}`
        : null);

    const address = hospital.address ? `\n📍 ${hospital.address}` : "";
    const directions = mapsUrl ? `\n📍 ${mapsUrl}` : "";

    return `${index + 1}. ${hospital.name}${address}${directions}`;
  });

  return [
    `Here are nearby hospitals${safeLabel}:`,
    "",
    ...lines,
    "",
    "If this is urgent, please go immediately to the nearest hospital.",
  ].join("\n");
}

function findNearbyFacilities(userLocation) {
  const facilities = loadFacilities();
  const locationContext = extractLocationContext(
    typeof userLocation === "string" ? { text: userLocation } : userLocation || {}
  );

  if (!locationContext || (locationContext.type === "coordinates" && !locationContext.label)) {
    return [];
  }

  const query = normalizeText(locationContext.query || locationContext.label || userLocation);
  const cacheKey = buildCacheKey("nearby-facilities", query);
  const cachedFacilities = getCache(cacheKey);

  if (cachedFacilities) {
    return cachedFacilities;
  }

  if (!query) {
    return [];
  }

  const matches = facilities.filter((facility) => {
    const facilityLocation = normalizeText(facility.location);
    const facilityName = normalizeText(facility.name);

    return (
      facilityLocation === query ||
      facilityLocation.includes(query) ||
      query.includes(facilityLocation) ||
      facilityName.includes(query)
    );
  });

  setCache(cacheKey, matches, LOCATION_CACHE_TTL);
  return matches;
}

function formatFacilityResponse(facilities, locationLabel = "") {
  const safeLabel = locationLabel ? ` near ${locationLabel}` : "";

  if (!Array.isArray(facilities) || facilities.length === 0) {
    return `I could not find a health facility${safeLabel}. Please tell me your town or nearest area name. If symptoms are serious, please visit the nearest health facility immediately.`;
  }

  const lines = facilities.map((facility, index) => {
    const services = Array.isArray(facility.services) && facility.services.length > 0 ? ` - ${facility.services.join(", ")}` : "";
    const place = facility.location ? ` (${facility.location})` : "";
    return `${index + 1}. ${facility.name}${place}${services}`;
  });

  return [
    `Here are nearby health facilities${safeLabel}:`,
    ...lines,
    "If symptoms are serious, please visit the nearest health facility immediately.",
  ].join("\n");
}

module.exports = {
  findNearbyFacilities,
  formatFacilityResponse,
  extractLocationContext,
  isFacilityRequest,
  isDirectionsRequest,
  getCoordinates,
  getNearbyHospitals,
  formatDirectionsResponse,
};