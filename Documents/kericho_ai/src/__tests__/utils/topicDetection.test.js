/**
 * Topic detection and duration parsing tests
 */

const {
  detectTopic,
  parseDuration,
  getKeywordsForTopic,
  getAvailableTopics,
} = require('../../../src/utils/topicDetection');

describe('Topic Detection', () => {
  test('detects malaria from English keywords', () => {
    expect(detectTopic('I have malaria')).toBe('malaria');
    expect(detectTopic('mosquito bite')).toBe('malaria');
    expect(detectTopic('I have a fever and chills')).toBe('malaria');
  });

  test('detects malaria from Swahili keywords', () => {
    expect(detectTopic('nina homa')).toBe('malaria');
    expect(detectTopic('wadudu wamenipiga')).toBe('malaria');
  });

  test('detects headache from English keywords', () => {
    expect(detectTopic('I have a headache')).toBe('headache');
    expect(detectTopic('migraine')).toBe('headache');
  });

  test('detects headache from Swahili keywords', () => {
    expect(detectTopic('kichwa kinavuma')).toBe('headache');
    expect(detectTopic('maumivu ya kichwa')).toBe('headache');
  });

  test('detects hiv_aids from keywords', () => {
    expect(detectTopic('hiv test')).toBe('hiv_aids');
    expect(detectTopic('aids')).toBe('hiv_aids');
    expect(detectTopic('arv treatment')).toBe('hiv_aids');
    expect(detectTopic('pep')).toBe('hiv_aids');
  });

  test('detects respiratory from keywords', () => {
    expect(detectTopic('I have a cough')).toBe('respiratory');
    expect(detectTopic('cold and flu')).toBe('respiratory');
    expect(detectTopic('kohoma')).toBe('respiratory');
  });

  test('detects maternal_health from keywords', () => {
    expect(detectTopic('pregnant')).toBe('maternal_health');
    expect(detectTopic('pregnancy')).toBe('maternal_health');
    expect(detectTopic('baby and mother')).toBe('maternal_health');
    expect(detectTopic('mimba')).toBe('maternal_health');
  });

  test('detects nutrition from keywords', () => {
    expect(detectTopic('nutrition and diet')).toBe('nutrition');
    expect(detectTopic('healthy eating')).toBe('nutrition');
    expect(detectTopic('lishe')).toBe('nutrition');
  });

  test('detects mental_health from keywords', () => {
    expect(detectTopic('stress')).toBe('mental_health');
    expect(detectTopic('depression')).toBe('mental_health');
    expect(detectTopic('anxiety')).toBe('mental_health');
  });

  test('detects waterborne diseases from keywords', () => {
    expect(detectTopic('diarrhea')).toBe('waterborne');
    expect(detectTopic('cholera')).toBe('waterborne');
    expect(detectTopic('kuhara')).toBe('waterborne');
  });

  test('returns null for unrecognized topic', () => {
    expect(detectTopic('hello')).toBeNull();
    expect(detectTopic('how are you')).toBeNull();
    expect(detectTopic('')).toBeNull();
  });

  test('is case-insensitive', () => {
    expect(detectTopic('MALARIA')).toBe('malaria');
    expect(detectTopic('MaLaRiA')).toBe('malaria');
    expect(detectTopic('HEADACHE')).toBe('headache');
  });
});

describe('Duration Parsing', () => {
  test('parses simple number as days', () => {
    const result = parseDuration('2');
    expect(result).toEqual({ raw: '2 days', days: 2 });
  });

  test('parses "N days" format', () => {
    expect(parseDuration('3 days')).toEqual({ raw: '3 days', days: 3 });
    expect(parseDuration('1 day')).toEqual({ raw: '1 day', days: 1 });
    expect(parseDuration('7 d')).toEqual({ raw: '7 d', days: 7 });
  });

  test('parses "N weeks" format', () => {
    expect(parseDuration('2 weeks')).toEqual({ raw: '2 weeks', days: 14 });
    expect(parseDuration('1 week')).toEqual({ raw: '1 week', days: 7 });
    expect(parseDuration('3 w')).toEqual({ raw: '3 w', days: 21 });
  });

  test('parses Swahili "siku N" format', () => {
    expect(parseDuration('siku 2')).toEqual({ raw: 'siku 2', days: 2 });
    expect(parseDuration('siku 5')).toEqual({ raw: 'siku 5', days: 5 });
  });

  test('parses Swahili "wiki N" format', () => {
    expect(parseDuration('wiki 2')).toEqual({ raw: 'wiki 2', days: 14 });
    expect(parseDuration('wiki 1')).toEqual({ raw: 'wiki 1', days: 7 });
  });

  test('parses yesterday/jana', () => {
    expect(parseDuration('yesterday')).toEqual({ raw: '1 day', days: 1 });
    expect(parseDuration('since yesterday')).toEqual({ raw: '1 day', days: 1 });
    expect(parseDuration('jana')).toEqual({ raw: '1 day', days: 1 });
  });

  test('parses today/leo', () => {
    expect(parseDuration('today')).toEqual({ raw: '0 days', days: 0 });
    expect(parseDuration('leo')).toEqual({ raw: '0 days', days: 0 });
  });

  test('parses "since morning"', () => {
    expect(parseDuration('since morning')).toEqual({ raw: 'since morning', days: 0 });
    expect(parseDuration('tangu asubuhi')).toEqual({ raw: 'since morning', days: 0 });
  });

  test('returns null for invalid duration', () => {
    expect(parseDuration('hello')).toBeNull();
    expect(parseDuration('abc')).toBeNull();
    expect(parseDuration('1000')).toBeNull(); // too large, unlikely to be days
    expect(parseDuration('')).toBeNull();
  });

  test('is case-insensitive', () => {
    const result1 = parseDuration('3 DAYS');
    expect(result1.days).toBe(3);
    expect(result1.raw).toBe('3 days'); // normalized to lowercase
    
    const result2 = parseDuration('2 WEEKS');
    expect(result2.days).toBe(14);
    expect(result2.raw).toBe('2 weeks'); // normalized to lowercase
  });
});

describe('Keyword Helpers', () => {
  test('getKeywordsForTopic returns keywords for valid topic', () => {
    const keywords = getKeywordsForTopic('malaria');
    expect(Array.isArray(keywords)).toBe(true);
    expect(keywords).toContain('malaria');
    expect(keywords).toContain('mosquito');
  });

  test('getKeywordsForTopic returns empty array for invalid topic', () => {
    const keywords = getKeywordsForTopic('invalid_topic');
    expect(keywords).toEqual([]);
  });

  test('getAvailableTopics returns list of topics', () => {
    const topics = getAvailableTopics();
    expect(Array.isArray(topics)).toBe(true);
    expect(topics).toContain('malaria');
    expect(topics).toContain('headache');
    expect(topics).toContain('hiv_aids');
    expect(topics.length).toBeGreaterThan(0);
  });
});
