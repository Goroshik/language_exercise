/**
 * Covers the orchestrator and word-selection half of generateTextService.
 * The pure text helpers live in generateTextService.test.ts.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DictionaryWord } from 'src/types';

const generateText = vi.fn();
const getAIService = vi.fn();
const findById = vi.fn();
const getLeastUsedWords = vi.fn();
const addHistoryBatch = vi.fn();
const checkAnswersExist = vi.fn();

vi.mock('src/repository/client', () => ({
  languageRepository: { findById: (...a: unknown[]) => findById(...a) },
  wordRepository: { getLeastUsedWords: (...a: unknown[]) => getLeastUsedWords(...a) },
  sentenceHistoryRepository: { addHistoryBatch: (...a: unknown[]) => addHistoryBatch(...a) },
  userAnswerRepository: { checkAnswersExist: (...a: unknown[]) => checkAnswersExist(...a) }
}));

vi.mock('src/services/aiFactory', () => ({
  AIFactory: { getAIService: (...a: unknown[]) => getAIService(...a) }
}));

const { TARGET_WORD_COUNT, mergeAdditionalWords, processGenerateTextRequest } =
  await import('./generateTextService');

const word = (id: string, text = id): DictionaryWord => ({
  id,
  word: text,
  translate: '',
  createdAt: new Date(0)
});

const body = {
  mode: 'student',
  topic: 'Present',
  languageId: 'lang-1',
  level: 'A1'
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  findById.mockResolvedValue({ code: 'pl', name: 'Polish' });
  getLeastUsedWords.mockResolvedValue([]);
  getAIService.mockResolvedValue({ generateText });
  generateText.mockResolvedValue('Ona **czyta** książkę.');
  addHistoryBatch.mockResolvedValue([{ id: 's1' }]);
  checkAnswersExist.mockResolvedValue({ s1: true });
});

describe('mergeAdditionalWords', () => {
  it('tops the selection up to the target', () => {
    const merged = mergeAdditionalWords([word('a')], [word('b'), word('c'), word('d'), word('e')]);
    expect(merged).toHaveLength(TARGET_WORD_COUNT);
  });

  it('keeps the user selection at the front', () => {
    const merged = mergeAdditionalWords([word('a')], [word('b')]);
    expect(merged.map(w => w.id)).toEqual(['a', 'b']);
  });

  it('never adds a word that is already selected', () => {
    const merged = mergeAdditionalWords([word('a')], [word('a'), word('b')]);
    expect(merged.map(w => w.id)).toEqual(['a', 'b']);
  });

  it('takes no more candidates than needed', () => {
    const candidates = ['b', 'c', 'd', 'e', 'f', 'g'].map(id => word(id));
    expect(mergeAdditionalWords([word('a')], candidates)).toHaveLength(TARGET_WORD_COUNT);
  });

  it('returns the selection untouched when it is already at the target', () => {
    const selected = ['a', 'b', 'c', 'd', 'e'].map(id => word(id));
    expect(mergeAdditionalWords(selected, [word('f')])).toBe(selected);
  });

  it('returns the selection untouched when it exceeds the target', () => {
    const selected = ['a', 'b', 'c', 'd', 'e', 'f'].map(id => word(id));
    expect(mergeAdditionalWords(selected, [word('g')])).toHaveLength(6);
  });

  it('copes with no candidates at all', () => {
    expect(mergeAdditionalWords([word('a')], [])).toEqual([word('a')]);
  });
});

describe('processGenerateTextRequest', () => {
  it('rejects a body that fails validation', async () => {
    const response = await processGenerateTextRequest({ topic: 'Present' }, 'u1');
    expect(response.status).toBe(400);
  });

  it('names every missing field in the validation error', async () => {
    const response = await processGenerateTextRequest({ topic: 'Present' }, 'u1');
    const message = String((response.body as { error: string }).error);
    expect(message).toContain('languageId');
    expect(message).toContain('level');
    expect(message).toContain('; ');
  });

  it('rejects a sentence count above the allowed maximum', async () => {
    const response = await processGenerateTextRequest({ ...body, sentenceCount: 21 }, 'u1');
    expect(response.status).toBe(400);
  });

  it('rejects a sentence count below the allowed minimum', async () => {
    const response = await processGenerateTextRequest({ ...body, sentenceCount: 0 }, 'u1');
    expect(response.status).toBe(400);
  });

  it('accepts a sentence count at the boundaries', async () => {
    for (const sentenceCount of [1, 20]) {
      const response = await processGenerateTextRequest({ ...body, sentenceCount }, 'u1');
      expect(response.status).toBe(200);
    }
  });

  it('tolerates a selected word with no text', async () => {
    const selectedWords = [{ ...word('a'), word: '' }];
    const response = await processGenerateTextRequest({ ...body, selectedWords }, 'u1');
    expect(response.status).toBe(200);
  });

  it('asks for enough candidates to cover the words already selected', async () => {
    const selectedWords = [word('a'), word('b')];
    await processGenerateTextRequest({ ...body, selectedWords }, 'u1');
    expect(getLeastUsedWords).toHaveBeenCalledWith('u1', 'pl', TARGET_WORD_COUNT + 2);
  });

  it('rejects an unknown language id', async () => {
    findById.mockResolvedValue(null);
    const response = await processGenerateTextRequest(body, 'u1');
    expect(response).toEqual({ status: 400, body: { error: 'Invalid language ID' } });
  });

  it('returns the formatted sentences on the happy path', async () => {
    const response = await processGenerateTextRequest(body, 'u1');
    expect(response).toMatchObject({
      status: 200,
      body: { success: true, data: ['Ona **czyta** książkę.'], sentenceIds: ['s1'] }
    });
  });

  it('reports which sentences already have an answer', async () => {
    const response = await processGenerateTextRequest(body, 'u1');
    expect(response.body).toMatchObject({ hasAnswers: { s1: true } });
  });

  it('skips the answer lookup when nothing was saved', async () => {
    addHistoryBatch.mockResolvedValue([]);
    const response = await processGenerateTextRequest(body, 'u1');
    expect(checkAnswersExist).not.toHaveBeenCalled();
    expect(response.body).toMatchObject({ hasAnswers: {} });
  });

  it('auto-fills words for an empty selection', async () => {
    getLeastUsedWords.mockResolvedValue([word('w1', 'czyta')]);
    await processGenerateTextRequest(body, 'u1');
    expect(String(generateText.mock.calls[0]?.[0])).toContain('czyta');
  });

  it('looks up the least used words for the language of the request', async () => {
    await processGenerateTextRequest(body, 'u1');
    expect(getLeastUsedWords).toHaveBeenCalledWith('u1', 'pl', expect.any(Number));
  });

  it('does not auto-fill when the user already picked enough', async () => {
    const selectedWords = ['a', 'b', 'c', 'd', 'e'].map(id => word(id));
    await processGenerateTextRequest({ ...body, selectedWords }, 'u1');
    expect(getLeastUsedWords).not.toHaveBeenCalled();
  });

  it('carries on when auto-selection fails', async () => {
    getLeastUsedWords.mockRejectedValue(new Error('db down'));
    const response = await processGenerateTextRequest(body, 'u1');
    expect(response.status).toBe(200);
  });

  it('uses the teacher prompt outside student mode', async () => {
    await processGenerateTextRequest({ ...body, mode: 'teacher' }, 'u1');
    expect(String(generateText.mock.calls[0]?.[0])).toContain('learning materials');
  });

  it('uses the student prompt in student mode', async () => {
    await processGenerateTextRequest(body, 'u1');
    expect(String(generateText.mock.calls[0]?.[0])).toContain('practicing the topic');
  });

  it('reports 502 when no AI service is configured', async () => {
    getAIService.mockResolvedValue(null);
    const response = await processGenerateTextRequest(body, 'u1');
    expect(response).toEqual({
      status: 502,
      body: { error: 'AI service not available for user' }
    });
  });

  it('reports 402 when the provider has no token', async () => {
    generateText.mockRejectedValue(new Error('No token found for service: openai'));
    const response = await processGenerateTextRequest(body, 'u1');
    expect(response).toEqual({
      status: 402,
      body: { error: 'AI service token not configured for user' }
    });
  });

  it('surfaces any other provider error message', async () => {
    generateText.mockRejectedValue(new Error('rate limited'));
    const response = await processGenerateTextRequest(body, 'u1');
    expect(response).toEqual({ status: 502, body: { error: 'rate limited' } });
  });

  it('falls back to a generic message for a non-Error rejection', async () => {
    generateText.mockRejectedValue('kaboom');
    const response = await processGenerateTextRequest(body, 'u1');
    expect(response).toEqual({
      status: 502,
      body: { error: 'Failed to generate text from AI service' }
    });
  });

  it('accepts an object response carrying text', async () => {
    generateText.mockResolvedValue({ text: 'Ona **czyta**.' });
    const response = await processGenerateTextRequest(body, 'u1');
    expect(response.body).toMatchObject({ data: ['Ona **czyta**.'] });
  });

  it('still answers when history cannot be saved', async () => {
    addHistoryBatch.mockRejectedValue(new Error('db down'));
    const response = await processGenerateTextRequest(body, 'u1');
    expect(response).toMatchObject({ status: 200, body: { sentenceIds: [] } });
  });

  it('does not try to save history for an empty generation', async () => {
    generateText.mockResolvedValue('');
    await processGenerateTextRequest(body, 'u1');
    expect(addHistoryBatch).not.toHaveBeenCalled();
  });

  it('reports 500 when something unexpected blows up', async () => {
    findById.mockRejectedValue(new Error('boom'));
    const response = await processGenerateTextRequest(body, 'u1');
    expect(response).toEqual({ status: 500, body: { error: 'Internal server error' } });
  });
});

describe('history records built from the generation', () => {
  const savedRecord = () => addHistoryBatch.mock.calls[0]?.[0]?.[0];

  it('stores the sentence without its trailing hints', async () => {
    generateText.mockResolvedValue('Ona **czyta** książkę.  (czytać)');
    await processGenerateTextRequest(body, 'u1');
    expect(savedRecord()).toMatchObject({ sentence: 'Ona **czyta** książkę.' });
  });

  it('stores the hints trimmed, alongside the sentence', async () => {
    generateText.mockResolvedValue('Ona **czyta**. (  czytać ,  książka  )');
    await processGenerateTextRequest(body, 'u1');
    expect(savedRecord()).toMatchObject({ hints: ['czytać', 'książka'] });
  });

  it('stores no hints when the sentence has none', async () => {
    generateText.mockResolvedValue('Ona **czyta** książkę.');
    await processGenerateTextRequest(body, 'u1');
    expect(savedRecord()).toMatchObject({ hints: [] });
  });

  it('reads hints glued to the sentence with no space', async () => {
    generateText.mockResolvedValue('Ona **czyta**.(czytać)');
    await processGenerateTextRequest(body, 'u1');
    expect(savedRecord()).toMatchObject({ sentence: 'Ona **czyta**.', hints: ['czytać'] });
  });

  it('reads hints followed by trailing whitespace', async () => {
    generateText.mockResolvedValue('Ona **czyta**. (czytać)   ');
    await processGenerateTextRequest(body, 'u1');
    expect(savedRecord()).toMatchObject({ hints: ['czytać'] });
  });

  it('drops a hint that is only whitespace', async () => {
    generateText.mockResolvedValue('Ona **czyta**. (czytać, , książka)');
    await processGenerateTextRequest(body, 'u1');
    expect(savedRecord()).toMatchObject({ hints: ['czytać', 'książka'] });
  });

  it('trims the stored sentence', async () => {
    generateText.mockResolvedValue('   Ona **czyta** książkę.');
    await processGenerateTextRequest(body, 'u1');
    expect(savedRecord()).toMatchObject({ sentence: 'Ona **czyta** książkę.' });
  });

  it('strips multi-digit numbering from the generated line', async () => {
    generateText.mockResolvedValue('12. Ona **czyta** książkę.');
    const response = await processGenerateTextRequest(body, 'u1');
    expect(response.body).toMatchObject({ data: ['Ona **czyta** książkę.'] });
  });

  it('strips a bullet followed by several spaces', async () => {
    generateText.mockResolvedValue('-   Ona **czyta** książkę.');
    const response = await processGenerateTextRequest(body, 'u1');
    expect(response.body).toMatchObject({ data: ['Ona **czyta** książkę.'] });
  });

  it('links the dictionary words the sentence marked in bold', async () => {
    getLeastUsedWords.mockResolvedValue([word('w1', 'czyta')]);
    generateText.mockResolvedValue('Ona **czyta** książkę.');
    await processGenerateTextRequest(body, 'u1');
    expect(savedRecord()).toMatchObject({ usedWordIds: ['w1'] });
  });

  it('carries the request context onto every record', async () => {
    await processGenerateTextRequest(body, 'u1');
    expect(savedRecord()).toMatchObject({
      ownerId: 'u1',
      languageId: 'lang-1',
      level: 'A1',
      mode: 'student',
      topic: 'Present'
    });
  });
});
