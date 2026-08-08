import { userSettingsRepository, userTokenRepository, wordRepository } from 'src/repository/client';

export async function translateWordService(userId: string, word: string) {
  if (!word || typeof word !== 'string') {
    throw new Error('Некорректный текст для перевода');
  }

  const cleanWord = word.trim().toLowerCase();
  const wordCount = cleanWord.split(/\s+/).filter(Boolean).length;

  // Allow translation of phrases up to 5 words
  if (wordCount === 0 || wordCount > 5) {
    throw new Error('Можно переводить от 1 до 5 слов');
  }

  // Check if word already exists in user's dictionary (only for single words)
  if (wordCount === 1) {
    const existingWord = await wordRepository.findByWord(userId, cleanWord);
    if (existingWord) {
      return {
        text: existingWord.translate,
        exists: true,
        wordId: existingWord.id
      };
    }
  }

  // Get user settings to determine source and target languages
  const userSettings = await userSettingsRepository.findByUserId(userId);
  const sourceLang = (userSettings?.learningLanguage || 'EN').toUpperCase();
  const targetLang = (userSettings?.translationLang || 'RU').toUpperCase();

  const tokens = await userTokenRepository.findByUser(userId);
  const deeplTokenObj = tokens.find(t => t.service === 'deepl');
  if (!deeplTokenObj?.token) {
    throw new Error('Токен DeepL не найден');
  }
  const response = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `DeepL-Auth-Key ${deeplTokenObj.token}`
    },
    body: new URLSearchParams({
      text: cleanWord,
      target_lang: targetLang,
      source_lang: sourceLang
    }).toString()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `DeepL API error: ${response.status} - ${errorData.message || response.statusText}`
    );
  }

  const data = await response.json();
  if (data.translations && data.translations[0]?.text) {
    return { text: data.translations[0].text, exists: false };
  }
  throw new Error(data.message || 'Ошибка перевода');
}
