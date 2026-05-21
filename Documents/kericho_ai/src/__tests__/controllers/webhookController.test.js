jest.mock("../../../src/lib/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

jest.mock("../../../src/services/whatsappService", () => ({
  parseIncomingMessage: jest.fn(),
  sendMessage: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock("../../../src/services/conversationService", () => ({
  processIncomingMessage: jest.fn(),
}));

const { parseIncomingMessage, sendMessage } = require("../../../src/services/whatsappService");
const { processIncomingMessage } = require("../../../src/services/conversationService");
const webhookController = require("../../../src/controllers/webhookController");

describe("webhookController duplicate message protection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("only sends one reply when the same webhook message id appears twice", async () => {
    parseIncomingMessage.mockReturnValue([
      {
        from: "254711413919",
        text: "hello",
        messageId: "wamid.test.1",
        phoneNumberId: "1139973609202308",
      },
      {
        from: "254711413919",
        text: "hello",
        messageId: "wamid.test.1",
        phoneNumberId: "1139973609202308",
      },
    ]);

    processIncomingMessage.mockResolvedValue({
      assistant: { reply: "Hi there, how can I help?" },
    });

    const req = {
      body: { entry: [] },
      originalUrl: "/webhook",
    };
    const res = {
      sendStatus: jest.fn(),
      status: jest.fn().mockReturnThis(),
      type: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await webhookController.handleWebhook(req, res);

    expect(processIncomingMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
      { to: "254711413919", message: "Hi there, how can I help?" },
      undefined,
      "1139973609202308"
    );
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });
});