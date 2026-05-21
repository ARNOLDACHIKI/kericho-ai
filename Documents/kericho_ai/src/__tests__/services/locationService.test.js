const {
  findNearbyFacilities,
  formatFacilityResponse,
  extractLocationContext,
  isFacilityRequest,
} = require("../../../services/locationService");

describe("Location Service", () => {
  test("detects text-based location names", () => {
    expect(extractLocationContext("I'm in Kericho")).toMatchObject({
      type: "text",
      label: "Kericho",
    });

    expect(extractLocationContext("Litein")).toMatchObject({
      type: "text",
      label: "Litein",
    });
  });

  test("extracts location coordinates from payloads", () => {
    const result = extractLocationContext({
      location: {
        name: "Kericho County Referral Hospital",
        latitude: -0.367,
        longitude: 35.283,
      },
    });

    expect(result).toMatchObject({
      type: "coordinates",
      label: "Kericho County Referral Hospital",
      coordinates: {
        latitude: -0.367,
        longitude: 35.283,
      },
    });
  });

  test("matches nearby facilities from a known location", () => {
    const facilities = findNearbyFacilities("Kericho");

    expect(facilities.length).toBeGreaterThan(0);
    expect(facilities[0].name).toBe("Kericho County Referral Hospital");
  });

  test("formats a readable facility response with safety guidance", () => {
    const message = formatFacilityResponse(
      [
        {
          name: "Kericho County Referral Hospital",
          location: "Kericho",
          services: ["general", "emergency"],
        },
      ],
      "Kericho"
    );

    expect(message).toContain("Here are nearby health facilities near Kericho:");
    expect(message).toContain("1. Kericho County Referral Hospital (Kericho) - general, emergency");
    expect(message).toContain(
      "If symptoms are serious, please visit the nearest health facility immediately."
    );
  });

  test("identifies facility lookup requests", () => {
    expect(isFacilityRequest("hospital near me")).toBe(true);
    expect(isFacilityRequest("clinic in Kericho")).toBe(true);
    expect(isFacilityRequest("hello there")).toBe(false);
  });
});