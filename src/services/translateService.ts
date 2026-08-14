import { userSettingsRepository, userTokenRepository, wordRepository } from 'src/repository/client';

const MAX_PHRASE_WORDS = 5;
const DEEPL_ENDPOINT = 'https://api-free.deepl.com/v2/translate';

export interface TranslationResult {
  text: string;
  exists: boolean;
  wordId?: string;
}

/** Trims and validates the input, returning the normalised phrase. */
export function normalisePhrase(word: string): string {
  if (!word || typeof word !== 'string') {
    throw new Error('Некорректный текст для перевода');
  }

  const cleaned = word.trim().toLowerCase();
  const wordCount = cleaned.split(/\s+/).filter(Boolean).length;

  if (wordCount === 0 || wordCount > MAX_PHRASE_WORDS) {
    throw new Error(`Можно переводить от 1 до ${MAX_PHRASE_WORDS} слов`);
  }

  return cleaned;
}

/** Single words may already be in the user's dictionary; phrases never are. */
async function findInDictionary(userId: string, phrase: string): Promise<TranslationResult | null> {
  if (phrase.includes(' ')) return null;

  const existing = await wordRepository.findByWord(userId, phrase);
  if (!existing) return null;

  return { text: existing.translate, exists: true, wordId: existing.id };
}

async function callDeepl(token: string, phrase: string, source: string, target: string) {
  const response = await fetch(DEEPL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `DeepL-Auth-Key ${token}`
    },
    body: new URLSearchParams({
      text: phrase,
      target_lang: target,
      source_lang: source
    }).toString()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `DeepL API error: ${response.status} - ${errorData.message || response.statusText}`
    );
  }

  const data = await response.json();
  const translated = data.translations?.[0]?.text;
  if (!translated) {
    throw new Error(data.message || 'Ошибка перевода');
  }

  return translated as string;
}

export async function translateWordService(
  userId: string,
  word: string
): Promise<TranslationResult> {
  const phrase = normalisePhrase(word);

  const known = await findInDictionary(userId, phrase);
  if (known) return known;

  const userSettings = await userSettingsRepository.findByUserId(userId);
  const sourceLang = (userSettings?.learningLanguage || 'EN').toUpperCase();
  const targetLang = (userSettings?.translationLang || 'RU').toUpperCase();

  const tokens = await userTokenRepository.findByUser(userId);
  const deeplToken = tokens.find(t => t.service === 'deepl')?.token;
  if (!deeplToken) {
    throw new Error('Токен DeepL не найден');
  }

  return { text: await callDeepl(deeplToken, phrase, sourceLang, targetLang), exists: false };
}
