// Jest setup file
// Environment variables for test isolation
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.SESSION_PROVIDER = 'memory';
process.env.LOG_LEVEL = 'silent';
process.env.WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'healthcare_ai_verify_token';
process.env.VERIFY_TOKEN = process.env.VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN;

// Mock external services to prevent actual API calls during tests
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: 'Mocked AI response for testing'
                }
              }
            ]
          })
        }
      }
    }))
  };
});

// Mock Baileys WhatsApp library
jest.mock('@whiskeysockets/baileys', () => ({
  default: jest.fn(),
  isJidBroadcast: jest.fn(x => false),
  isJidGroup: jest.fn(x => false),
}), { virtual: true });

// Global test utilities and helpers
global.testHelpers = {
  createMockRequest: (overrides = {}) => ({
    body: {},
    query: {},
    params: {},
    headers: {},
    ...overrides
  }),
  
  createMockResponse: () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    res.send = jest.fn(() => res);
    res.end = jest.fn(() => res);
    return res;
  },
  
  createMockPhone: () => '254' + Math.floor(100000000 + Math.random() * 900000000)
};
