import { beforeEach, describe, expect, it, vi } from 'vitest';

const findByWord = vi.fn();
const findByUserId = vi.fn();
const findByUser = vi.fn();

vi.mock('src/repository/client', () => ({
  wordRepository: {
    findByWord: (...args: unknown[]) => findByWord(...args)
  },
  userSettingsRepository: {
    findByUserId: (...args: unknown[]) => findByUserId(...args)
  },
  userTokenRepository: {
    findByUser: (...args: unknown[]) => findByUser(...args)
  }
}));

const { normalisePhrase, translateWordService } = await import('./translateService');

const deeplOk = (text: string) =>
  vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ translations: [{ text }] })
  });

beforeEach(() => {
  vi.clearAllMocks();
  findByWord.mockResolvedValue(null);
  findByUserId.mockResolvedValue({ learningLanguage: 'pl', translationLang: 'ru' });
  findByUser.mockResolvedValue([{ service: 'deepl', token: 'secret' }]);
});

describe('normalisePhrase', () => {
  it('trims and lowercases', () => {
    expect(normalisePhrase('  Książka  ')).toBe('książka');
  });

  it('accepts a phrase of five words', () => {
    expect(normalisePhrase('a b c d e')).toBe('a b c d e');
  });

  it('rejects a phrase of six words', () => {
    expect(() => normalisePhrase('a b c d e f')).toThrow(/от 1 до 5/);
  });

  it('rejects whitespace only', () => {
    expect(() => normalisePhrase('   ')).toThrow(/от 1 до 5/);
  });

  it('rejects an empty string', () => {
    expect(() => normalisePhrase('')).toThrow(/Некорректный текст/);
  });

  it('rejects a non-string', () => {
    expect(() => normalisePhrase(42 as unknown as string)).toThrow(/Некорректный текст/);
  });

  it('collapses repeated whitespace when counting words', () => {
    expect(normalisePhrase('a    b')).toBe('a    b');
  });
});

describe('translateWordService', () => {
  it('returns the dictionary entry for a known single word', async () => {
    findByWord.mockResolvedValue({ id: 'w1', translate: 'книга' });
    vi.stubGlobal('fetch', vi.fn());

    await expect(translateWordService('u1', 'Książka')).resolves.toEqual({
      text: 'книга',
      exists: true,
      wordId: 'w1'
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('never looks a multi-word phrase up in the dictionary', async () => {
    vi.stubGlobal('fetch', deeplOk('добрый день'));

    await expect(translateWordService('u1', 'dzień dobry')).resolves.toEqual({
      text: 'добрый день',
      exists: false
    });
    expect(findByWord).not.toHaveBeenCalled();
  });

  it('calls DeepL with the languages from user settings', async () => {
    const fetchMock = deeplOk('книга');
    vi.stubGlobal('fetch', fetchMock);

    await translateWordService('u1', 'książka');

    const body = String(fetchMock.mock.calls[0]?.[1]?.body);
    expect(body).toContain('source_lang=PL');
    expect(body).toContain('target_lang=RU');
  });

  it('falls back to EN/RU when settings are missing', async () => {
    findByUserId.mockResolvedValue(null);
    const fetchMock = deeplOk('книга');
    vi.stubGlobal('fetch', fetchMock);

    await translateWordService('u1', 'book');

    const body = String(fetchMock.mock.calls[0]?.[1]?.body);
    expect(body).toContain('source_lang=EN');
    expect(body).toContain('target_lang=RU');
  });

  it('fails when the user has no DeepL token', async () => {
    findByUser.mockResolvedValue([{ service: 'openai', token: 'x' }]);

    await expect(translateWordService('u1', 'książka')).rejects.toThrow(/Токен DeepL/);
  });

  it('surfaces a DeepL HTTP error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve({ message: 'quota exceeded' })
      })
    );

    await expect(translateWordService('u1', 'książka')).rejects.toThrow(/429 - quota exceeded/);
  });

  it('fails when DeepL returns no translation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ translations: [] })
      })
    );

    await expect(translateWordService('u1', 'książka')).rejects.toThrow(/Ошибка перевода/);
  });
});
