import { userTokenRepository, wordRepository } from 'src/repository/client';

export async function translateWordService(userId: string, word: string) {
  if (!word || typeof word !== 'string' || word.trim().split(/\s+/).length > 1) {
    throw new Error('Можно переводить только одно слово');
  }

  const cleanWord = word.trim().toLowerCase();

  // Check if word already exists in user's dictionary
  const existingWord = await wordRepository.findByWord(userId, cleanWord);
  if (existingWord) {
    return {
      text: existingWord.translate,
      exists: true,
      wordId: existingWord.id
    };
  }

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
      target_lang: 'RU',
      source_lang: 'EN'
    }).toString()
  });
  const data = await response.json();
  if (data.translations && data.translations[0]?.text) {
    return { text: data.translations[0].text, exists: false };
  }
  throw new Error(data.message || 'Ошибка перевода');
}
