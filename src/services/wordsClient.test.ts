import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addWords, isDuplicateWord, parseWordsFromText } from './wordsClient';

const ok = (body: unknown) => ({ ok: true, status: 200, json: () => Promise.resolve(body) });
const httpError = (status: number) => ({
  ok: false,
  status,
  json: () => Promise.resolve({})
});

const stubFetch = (response: unknown) => {
  const mock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', mock);
  return mock;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('parseWordsFromText', () => {
  it('returns the normalised words', async () => {
    stubFetch(ok({ words: [{ word: 'book', translate: 'книга' }] }));
    await expect(parseWordsFromText('book - книга')).resolves.toEqual([
      { word: 'book', translate: 'книга', isDuplicate: false }
    ]);
  });

  it('posts the text to the parse endpoint', async () => {
    const fetchMock = stubFetch(ok({ words: [{ word: 'a' }] }));
    await parseWordsFromText('raw text');

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/ai/parse-words');
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({ text: 'raw text' });
  });

  it('carries the duplicate flags through', async () => {
    stubFetch(ok({ words: [{ word: 'book', isDuplicate: true }] }));
    await expect(parseWordsFromText('x')).resolves.toMatchObject([{ isDuplicate: true }]);
  });

  it('fails on an HTTP error, naming the status', async () => {
    stubFetch(httpError(500));
    await expect(parseWordsFromText('x')).rejects.toThrow('API request failed: 500');
  });

  it('fails when the model found nothing', async () => {
    stubFetch(ok({ words: [] }));
    await expect(parseWordsFromText('x')).rejects.toThrow(/returned no results/);
  });

  it('fails when the payload has no words at all', async () => {
    stubFetch(ok({}));
    await expect(parseWordsFromText('x')).rejects.toThrow(/returned no results/);
  });
});

describe('isDuplicateWord', () => {
  it('reports a known word', async () => {
    stubFetch(ok({ success: true, duplicates: [true] }));
    await expect(isDuplicateWord('book')).resolves.toBe(true);
  });

  it('reports an unknown word', async () => {
    stubFetch(ok({ success: true, duplicates: [false] }));
    await expect(isDuplicateWord('book')).resolves.toBe(false);
  });

  it('reports false when the check was unsuccessful', async () => {
    stubFetch(ok({ success: false, duplicates: [true] }));
    await expect(isDuplicateWord('book')).resolves.toBe(false);
  });

  it('reports false when there are no duplicates in the payload', async () => {
    stubFetch(ok({ success: true }));
    await expect(isDuplicateWord('book')).resolves.toBe(false);
  });

  it('sends the word as a single-entry list', async () => {
    const fetchMock = stubFetch(ok({ success: true, duplicates: [false] }));
    await isDuplicateWord('book');

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/dictionary/words/check-duplicates');
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({ words: ['book'] });
  });

  it('fails on an HTTP error', async () => {
    stubFetch(httpError(404));
    await expect(isDuplicateWord('book')).rejects.toThrow('API request failed: 404');
  });
});

describe('addWords', () => {
  it('posts the words to the dictionary endpoint', async () => {
    const fetchMock = stubFetch(ok({ success: true, word: 'saved' }));
    const words = [{ word: 'book', translate: 'книга' }];

    await expect(addWords(words)).resolves.toBe('saved');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/dictionary/words');
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({ words });
  });

  it('surfaces the server error message', async () => {
    stubFetch(ok({ success: false, error: 'limit reached' }));
    await expect(addWords([])).rejects.toThrow('limit reached');
  });

  it('falls back to a generic message', async () => {
    stubFetch(ok({ success: false }));
    await expect(addWords([])).rejects.toThrow('Failed to add words');
  });

  it('propagates a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(addWords([])).rejects.toThrow('offline');
  });
});
