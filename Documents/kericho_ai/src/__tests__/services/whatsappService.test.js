jest.mock("@whiskeysockets/baileys", () => ({
  __esModule: true,
  default: jest.fn(),
  useMultiFileAuthState: jest.fn(),
  DisconnectReason: {},
}));

const { parseIncomingMessage } = require("../../../src/services/whatsappService");

describe("WhatsApp message parsing", () => {
  test("keeps text messages", () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                metadata: {
                  phone_number_id: "1139973609202308",
                },
                messages: [
                  {
                    from: "254712345678",
                    id: "msg-1",
                    timestamp: "123",
                    type: "text",
                    text: { body: "hospital near me" },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const messages = parseIncomingMessage(payload);

    expect(Array.isArray(messages)).toBe(true);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      from: "254712345678",
      text: "hospital near me",
      type: "text",
      phoneNumberId: "1139973609202308",
    });
  });
});
