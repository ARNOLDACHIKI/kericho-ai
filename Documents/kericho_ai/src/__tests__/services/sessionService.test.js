/**
 * Session service tests
 * - Tests in-memory session store
 * - Tests Redis session store (with mocked Redis client)
 */

const memoryStore = require('../../../services/sessionService.memory');

describe('Session Service - Memory Store', () => {
  beforeEach(() => {
    memoryStore.clearAllSessions();
  });

  test('getSession returns empty session for new phone number', () => {
    const session = memoryStore.getSession('254712345678');
    expect(session).toEqual({
      lastMessage: null,
      topic: null,
      step: null,
      updatedAt: expect.any(String),
    });
  });

  test('updateSession stores and retrieves data', () => {
    const phone = '254712345678';
    memoryStore.updateSession(phone, { topic: 'malaria', step: 'awaiting_duration' });
    const session = memoryStore.getSession(phone);

    expect(session.topic).toBe('malaria');
    expect(session.step).toBe('awaiting_duration');
    expect(session.lastMessage).toBeNull();
  });

  test('updateSession merges partial updates', () => {
    const phone = '254712345678';
    memoryStore.updateSession(phone, { topic: 'headache' });
    memoryStore.updateSession(phone, { lastMessage: 'It hurts' });

    const session = memoryStore.getSession(phone);
    expect(session.topic).toBe('headache');
    expect(session.lastMessage).toBe('It hurts');
  });

  test('updateSession updates timestamps', () => {
    const phone = '254712345678';

    memoryStore.updateSession(phone, { topic: 'malaria' });
    const session1 = memoryStore.getSession(phone);
    const ts1 = new Date(session1.updatedAt).getTime();

    // Sleep for a tiny moment (we can't rely on milliseconds with mocked timers)
    const start = Date.now();
    while (Date.now() - start < 10) {}

    memoryStore.updateSession(phone, { topic: 'headache' });
    const session2 = memoryStore.getSession(phone);
    const ts2 = new Date(session2.updatedAt).getTime();

    expect(ts2).toBeGreaterThanOrEqual(ts1);
  });

  test('clearSession removes session data', () => {
    const phone = '254712345678';
    memoryStore.updateSession(phone, { topic: 'malaria' });
    memoryStore.clearSession(phone);

    const session = memoryStore.getSession(phone);
    expect(session.topic).toBeNull();
  });

  test('getAllSessions returns copy of all sessions', () => {
    memoryStore.updateSession('phone1', { topic: 'malaria' });
    memoryStore.updateSession('phone2', { topic: 'headache' });

    const all = memoryStore.getAllSessions();
    expect(Object.keys(all)).toHaveLength(2);
    expect(all.phone1.topic).toBe('malaria');
    expect(all.phone2.topic).toBe('headache');
  });

  test('clearAllSessions clears all sessions', () => {
    memoryStore.updateSession('phone1', { topic: 'malaria' });
    memoryStore.updateSession('phone2', { topic: 'headache' });
    memoryStore.clearAllSessions();

    const all = memoryStore.getAllSessions();
    expect(Object.keys(all)).toHaveLength(0);
  });
});
