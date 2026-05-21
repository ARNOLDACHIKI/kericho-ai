jest.mock("../../../src/services/aiService", () => ({
  generateAiResponse: jest.fn(),
}));

jest.mock("../../../src/services/safetyService", () => ({
  detectEmergency: jest.fn(() => false),
  buildSafetyPrefix: jest.fn(() => "ℹ️"),
}));

jest.mock("../../../src/utils/greetingDetection", () => ({
  isGreeting: jest.fn(() => false),
}));

jest.mock("../../../src/utils/symptomDetection", () => ({
  detectSymptom: jest.fn(() => null),
  getSymptomName: jest.fn(() => null),
  getFirstSymptomQuestion: jest.fn(() => null),
}));

jest.mock("../../../src/lib/prisma", () => ({
  isConnected: jest.fn(() => true),
  user: {
    upsert: jest.fn().mockResolvedValue({ id: "user-1", whatsappNumber: "254712345678" }),
    findUnique: jest.fn().mockResolvedValue({ id: "user-1", whatsappNumber: "254712345678" }),
  },
  conversationMessage: {
    create: jest.fn().mockResolvedValue({ id: "message-1" }),
    findMany: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock("../../../src/services/whatsappService", () => ({
  sendMessage: jest.fn().mockResolvedValue({ ok: true }),
}));

const { generateAiResponse } = require("../../../src/services/aiService");
const responseService = require("../../../src/services/responseService");
const conversationService = require("../../../src/services/conversationService");
const prisma = require("../../../src/lib/prisma");

describe("responseService and conversationService regression coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("buildAssistantReply returns a structured AI reply for a normal message", async () => {
    generateAiResponse.mockResolvedValue({
      reply: "Please drink water and rest. If symptoms worsen, seek medical care.",
      source: "ai",
      emergency: false,
      language: "en",
    });

    const assistant = await responseService.buildAssistantReply("I need general health advice");

    expect(assistant).toMatchObject({
      reply: "Please drink water and rest. If symptoms worsen, seek medical care.",
      topic: "general",
      source: "ai",
      escalationSuggested: false,
    });
  });

  test("processMessage returns the reply without sending it directly", async () => {
    generateAiResponse.mockResolvedValue({
      reply: "Please drink water and rest. If symptoms worsen, seek medical care.",
      source: "ai",
      emergency: false,
      language: "en",
    });

    const reply = await responseService.processMessage("254712345678", "I need general health advice");

    expect(reply).toContain("Please drink water and rest");
  });

  test("processIncomingMessage in conversationService uses the assistant builder without crashing", async () => {
    generateAiResponse.mockResolvedValue({
      reply: "Please drink water and rest. If symptoms worsen, seek medical care.",
      source: "ai",
      emergency: false,
      language: "en",
    });

    const result = await conversationService.processIncomingMessage({
      from: "254712345678",
      text: "I need general health advice",
      source: "whatsapp",
      preferredLanguage: "en",
    });

    expect(result).toMatchObject({
      user: {
        id: "user-1",
        whatsappNumber: "254712345678",
      },
      assistant: {
        reply: "Please drink water and rest. If symptoms worsen, seek medical care.",
        topic: "general",
        source: "ai",
        escalationSuggested: false,
      },
    });

    expect(prisma.user.upsert).toHaveBeenCalled();
    expect(prisma.conversationMessage.create).toHaveBeenCalled();
  });
});
