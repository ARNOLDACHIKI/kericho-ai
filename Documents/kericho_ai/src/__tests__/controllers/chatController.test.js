jest.mock("../../../services/sessionService", () => ({
  getSession: jest.fn(),
  updateSession: jest.fn(),
  clearSession: jest.fn(),
}));

jest.mock("../../../services/knowledgeService", () => ({
  findFAQ: jest.fn(),
}));

jest.mock("../../../src/utils/topicDetection", () => ({
  detectTopic: jest.fn(),
  parseDuration: jest.fn(),
}));

jest.mock("../../../services/locationService", () => ({
  extractLocationContext: jest.fn(),
  findNearbyFacilities: jest.fn(),
  formatFacilityResponse: jest.fn(),
  isFacilityRequest: jest.fn(),
}));

const sessionService = require("../../../services/sessionService");
const { findFAQ } = require("../../../services/knowledgeService");
const { detectTopic, parseDuration } = require("../../../src/utils/topicDetection");
const {
  extractLocationContext,
  findNearbyFacilities,
  formatFacilityResponse,
  isFacilityRequest,
} = require("../../../services/locationService");

const { handleIncomingMessage } = require("../../../controllers/chatController");

function createResponse() {
  return {
    statusCode: null,
    jsonBody: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.jsonBody = body;
      return this;
    },
  };
}

describe("chatController location handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionService.getSession.mockResolvedValue({ step: null, location: null });
    sessionService.updateSession.mockResolvedValue({});
    findFAQ.mockReturnValue(null);
    detectTopic.mockReturnValue(null);
    parseDuration.mockReturnValue(null);
  });

  test("returns nearby facilities when the user asks for a clinic near a known location", async () => {
    extractLocationContext.mockReturnValue({ type: "text", label: "Kericho", query: "kericho" });
    isFacilityRequest.mockReturnValue(true);
    findNearbyFacilities.mockReturnValue([
      { name: "Kericho County Referral Hospital", location: "Kericho", services: ["general", "emergency"] },
      { name: "Litein Mission Hospital", location: "Litein", services: ["general", "maternity"] },
    ]);
    formatFacilityResponse.mockReturnValue("Here are nearby health facilities:\n1. Kericho County Referral Hospital");

    const req = { body: { text: "clinic in Kericho", from: "254712345678" } };
    const res = createResponse();

    await handleIncomingMessage(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody.message).toContain("Here are nearby health facilities");
    expect(res.jsonBody.source).toBe("location");
    expect(sessionService.updateSession).toHaveBeenCalledWith(
      "254712345678",
      expect.objectContaining({ location: expect.objectContaining({ label: "Kericho" }) })
    );
  });

  test("asks for the location when facility lookup has no area to match", async () => {
    extractLocationContext.mockReturnValue(null);
    isFacilityRequest.mockReturnValue(true);

    const req = { body: { text: "hospital near me", from: "254712345678" } };
    const res = createResponse();

    await handleIncomingMessage(req, res);

    expect(res.jsonBody.message).toBe(
      "Please tell me your location so I can suggest nearby health facilities."
    );
    expect(res.jsonBody.source).toBe("location");
  });

  test("saves a shared location even when the user has not asked for facilities yet", async () => {
    extractLocationContext.mockReturnValue({ type: "text", label: "Ainamoi", query: "ainamoi" });
    isFacilityRequest.mockReturnValue(false);

    const req = { body: { text: "I'm in Ainamoi", from: "254712345678" } };
    const res = createResponse();

    await handleIncomingMessage(req, res);

    expect(res.jsonBody.message).toBe(
      "Location saved for Ainamoi. Ask me for nearby health facilities anytime."
    );
    expect(res.jsonBody.source).toBe("location");
  });
});