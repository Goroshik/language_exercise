import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CheckAnswerItem } from 'src/types';

const generateText = vi.fn();
const getAIService = vi.fn();
const findByCode = vi.fn();
const getUserSettings = vi.fn();
const getAllWords = vi.fn();
const incrementUsageForWords = vi.fn();

vi.mock('src/repository/client', () => ({
  languageRepository: { findByCode: (...a: unknown[]) => findByCode(...a) },
  wordRepository: { getAllWords: (...a: unknown[]) => getAllWords(...a) },
  wordUsageStatsRepository: {
    incrementUsageForWords: (...a: unknown[]) => incrementUsageForWords(...a)
  }
}));

vi.mock('src/services/aiFactory', () => ({
  AIFactory: { getAIService: (...a: unknown[]) => getAIService(...a) }
}));

vi.mock('src/services/userSettingsService', () => ({
  getUserSettingsService: (...a: unknown[]) => getUserSettings(...a)
}));

const {
  buildFullResults,
  extractResponseText,
  extractUserWords,
  indexResultsById,
  parseAiResults,
  processCheckAnswersRequest
} = await import('./checkAnswersService');

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  getAIService.mockResolvedValue({ generateText });
  getUserSettings.mockResolvedValue({ learningLanguage: 'pl' });
  findByCode.mockResolvedValue({ name: 'Polish' });
  getAllWords.mockResolvedValue([]);
  generateText.mockResolvedValue('[{"id":"e1","isCorrect":true}]');
});

describe('extractResponseText', () => {
  it('passes a plain string through', () => {
    expect(extractResponseText('hello')).toBe('hello');
  });

  it('reads the text field of an object response', () => {
    expect(extractResponseText({ text: 'hello' })).toBe('hello');
  });

  it('returns an empty string for an object without text', () => {
    expect(extractResponseText({ other: 1 })).toBe('');
  });

  it.each([null, undefined, 42, true])('returns an empty string for %s', value => {
    expect(extractResponseText(value)).toBe('');
  });
});

describe('parseAiResults', () => {
  it('parses a bare JSON array', () => {
    expect(parseAiResults('[{"id":"e1","isCorrect":true}]')).toEqual([
      { id: 'e1', isCorrect: true }
    ]);
  });

  it('finds the array inside surrounding prose', () => {
    expect(
      parseAiResults('Here you go:\n[{"id":"e1","isCorrect":false}]\nHope that helps')
    ).toEqual([{ id: 'e1', isCorrect: false }]);
  });

  it('finds the array inside a markdown fence', () => {
    expect(parseAiResults('```json\n[{"id":"e1","isCorrect":true}]\n```')).toHaveLength(1);
  });

  it('handles an empty array', () => {
    expect(parseAiResults('[]')).toEqual([]);
  });

  it('throws when there is no array at all', () => {
    expect(() => parseAiResults('sorry, I cannot help')).toThrow(/No JSON array/);
  });

  it('throws when the array is malformed', () => {
    expect(() => parseAiResults('[{"id":]')).toThrow();
  });
});

describe('indexResultsById', () => {
  it('strips the id out of the stored verdict', () => {
    const byId = indexResultsById([{ id: 'e1', isCorrect: false, grammarError: 'bad case' }]);
    expect(byId.get('e1')).toEqual({ isCorrect: false, grammarError: 'bad case' });
  });

  it('keeps the last verdict when an id repeats', () => {
    const byId = indexResultsById([
      { id: 'e1', isCorrect: true },
      { id: 'e1', isCorrect: false }
    ]);
    expect(byId.get('e1')).toEqual({ isCorrect: false });
  });

  it('returns an empty map for no results', () => {
    expect(indexResultsById([]).size).toBe(0);
  });
});

describe('extractUserWords', () => {
  it('lowercases and strips punctuation', () => {
    expect(extractUserWords([{ id: 'e1', sentence: 'Ona Czyta, książkę!' }])).toEqual([
      'ona',
      'czyta',
      'książkę'
    ]);
  });

  it('drops single-character tokens', () => {
    expect(extractUserWords([{ id: 'e1', sentence: 'a bc d' }])).toEqual(['bc']);
  });

  it('collects across every exercise', () => {
    expect(
      extractUserWords([
        { id: 'e1', sentence: 'ona czyta' },
        { id: 'e2', sentence: 'on pisze' }
      ])
    ).toEqual(['ona', 'czyta', 'on', 'pisze']);
  });

  it('returns nothing for blank sentences', () => {
    expect(extractUserWords([{ id: 'e1', sentence: '   ' }])).toEqual([]);
  });

  it('drops digits along with punctuation', () => {
    expect(extractUserWords([{ id: 'e1', sentence: 'rok 2026 był' }])).toEqual(['rok', 'był']);
  });
});

describe('buildFullResults', () => {
  const verdicts = new Map<string, CheckAnswerItem>([['e1', { isCorrect: false }]]);

  it('returns the AI verdict for an answered exercise', () => {
    expect(buildFullResults([{ id: 'e1', sentence: 'ona czyta' }], verdicts)).toEqual([
      { isCorrect: false }
    ]);
  });

  it('marks a blank exercise as skipped', () => {
    expect(buildFullResults([{ id: 'e2', sentence: '  ' }], verdicts)).toEqual([
      { isCorrect: true, skipped: true }
    ]);
  });

  it('passes an exercise the AI silently dropped', () => {
    expect(buildFullResults([{ id: 'e9', sentence: 'ona czyta' }], verdicts)).toEqual([
      { isCorrect: true }
    ]);
  });

  it('keeps one result per submitted exercise, in order', () => {
    const results = buildFullResults(
      [
        { id: 'e1', sentence: 'ona czyta' },
        { id: 'e2', sentence: '' },
        { id: 'e9', sentence: 'on pisze' }
      ],
      verdicts
    );
    expect(results).toEqual([
      { isCorrect: false },
      { isCorrect: true, skipped: true },
      { isCorrect: true }
    ]);
  });
});

describe('processCheckAnswersRequest', () => {
  const body = { topic: 'Present', exercises: [{ id: 'e1', sentence: 'ona czyta' }] };

  it('rejects a body that fails validation', async () => {
    const response = await processCheckAnswersRequest({ topic: 'Present' }, 'u1');
    expect(response.status).toBe(400);
  });

  it('rejects a request with nothing but blank answers', async () => {
    const response = await processCheckAnswersRequest(
      { topic: 'Present', exercises: [{ id: 'e1', sentence: '   ' }] },
      'u1'
    );
    expect(response).toMatchObject({ status: 400, body: { error: 'No sentences to check' } });
  });

  it('returns the verdicts on the happy path', async () => {
    const response = await processCheckAnswersRequest(body, 'u1');
    expect(response).toMatchObject({ status: 200, body: { data: [{ isCorrect: true }] } });
  });

  it('resolves the language from user settings when not supplied', async () => {
    await processCheckAnswersRequest(body, 'u1');
    expect(findByCode).toHaveBeenCalledWith('pl');
  });

  it('skips the language lookup when the name is supplied', async () => {
    await processCheckAnswersRequest({ ...body, languageName: 'Polish' }, 'u1');
    // getUserSettingsService is still reached by the background word tracking,
    // so the language lookup itself is what must not happen.
    expect(findByCode).not.toHaveBeenCalled();
  });

  it('falls back to English when the language code is unknown', async () => {
    findByCode.mockResolvedValue(null);
    await processCheckAnswersRequest(body, 'u1');
    expect(String(generateText.mock.calls[0]?.[0])).toContain('English');
  });

  it('falls back to the en language code when settings carry none', async () => {
    getUserSettings.mockResolvedValue({});
    await processCheckAnswersRequest(body, 'u1');
    expect(findByCode).toHaveBeenCalledWith('en');
  });

  it('passes the user id to the provider alongside the prompt', async () => {
    await processCheckAnswersRequest(body, 'u1');
    expect(generateText).toHaveBeenCalledWith(expect.any(String), 'u1');
  });

  it('sends only the answered exercises to the provider', async () => {
    await processCheckAnswersRequest(
      {
        ...body,
        exercises: [
          { id: 'e1', sentence: 'ona czyta' },
          { id: 'e2', sentence: '  ' }
        ]
      },
      'u1'
    );
    const prompt = String(generateText.mock.calls[0]?.[0]);
    expect(prompt).toContain('e1');
    expect(prompt).not.toContain('e2');
  });

  it('still answers for the blank exercise it did not send', async () => {
    const response = await processCheckAnswersRequest(
      {
        ...body,
        exercises: [
          { id: 'e1', sentence: 'ona czyta' },
          { id: 'e2', sentence: '  ' }
        ]
      },
      'u1'
    );
    expect(response.body).toMatchObject({
      data: [{ isCorrect: true }, { isCorrect: true, skipped: true }]
    });
  });

  it('joins several validation messages with a semicolon', async () => {
    const response = await processCheckAnswersRequest({}, 'u1');
    expect(String((response.body as { error: string }).error)).toContain('; ');
  });

  it('reports 502 with an explanation when no AI service is configured', async () => {
    getAIService.mockResolvedValue(null);
    const response = await processCheckAnswersRequest(body, 'u1');
    expect(response).toEqual({
      status: 502,
      body: { error: 'AI service not available for user' }
    });
  });

  it('rejects an AI service that cannot generate text', async () => {
    getAIService.mockResolvedValue({ generateText: 'not a function' });
    const response = await processCheckAnswersRequest(body, 'u1');
    expect(response.status).toBe(502);
  });

  it('reports 402 with an explanation when the provider has no token', async () => {
    generateText.mockRejectedValue(new Error('No token found for service: openai'));
    const response = await processCheckAnswersRequest(body, 'u1');
    expect(response).toEqual({
      status: 402,
      body: { error: 'AI service token not configured for user' }
    });
  });

  it('falls back to a generic message when the provider throws a non-Error', async () => {
    generateText.mockRejectedValue('kaboom');
    const response = await processCheckAnswersRequest(body, 'u1');
    expect(response).toEqual({
      status: 502,
      body: { error: 'Failed to validate answers via AI service' }
    });
  });

  it('accepts an object response carrying text', async () => {
    generateText.mockResolvedValue({ text: '[{"id":"e1","isCorrect":false}]' });
    const response = await processCheckAnswersRequest(body, 'u1');
    expect(response.body).toMatchObject({ data: [{ isCorrect: false }] });
  });

  it('marks the response successful', async () => {
    const response = await processCheckAnswersRequest(body, 'u1');
    expect(response.body).toMatchObject({ success: true });
  });

  it('records the words the learner used', async () => {
    getAllWords.mockResolvedValue([{ id: 'w1', word: 'czyta' }]);
    await processCheckAnswersRequest(body, 'u1');
    await vi.waitFor(() => expect(incrementUsageForWords).toHaveBeenCalledWith('u1', ['w1']));
  });

  it('does not touch the usage counters when nothing matched', async () => {
    getAllWords.mockResolvedValue([{ id: 'w1', word: 'pisze' }]);
    await processCheckAnswersRequest(body, 'u1');
    expect(incrementUsageForWords).not.toHaveBeenCalled();
  });

  it('reports 502 for any other provider failure', async () => {
    generateText.mockRejectedValue(new Error('rate limited'));
    const response = await processCheckAnswersRequest(body, 'u1');
    expect(response).toMatchObject({ status: 502, body: { error: 'rate limited' } });
  });

  it('reports 502 when the response has no JSON array', async () => {
    generateText.mockResolvedValue('sorry, I cannot help');
    const response = await processCheckAnswersRequest(body, 'u1');
    expect(response.status).toBe(502);
  });

  it('reports 500 when something unexpected blows up', async () => {
    getAIService.mockRejectedValue(new Error('boom'));
    const response = await processCheckAnswersRequest(body, 'u1');
    expect(response.status).toBe(500);
  });

  it('does not let a word-tracking failure break the response', async () => {
    getAllWords.mockRejectedValue(new Error('db down'));
    const response = await processCheckAnswersRequest(body, 'u1');
    expect(response.status).toBe(200);
  });
});
