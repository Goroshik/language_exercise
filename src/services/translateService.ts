import { userTokenRepository } from 'src/repository/client';

export async function translateWordService(userId: string, word: string) {
  if (!word || typeof word !== 'string' || word.trim().split(/\s+/).length > 1) {
    throw new Error('Можно переводить только одно слово');
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
      'Authorization': `DeepL-Auth-Key ${deeplTokenObj.token}`
    },
    body: new URLSearchParams({
      text: word,
      target_lang: 'RU',
      source_lang: 'EN'
    }).toString()
  });
  const data = await response.json();
  if (data.translations && data.translations[0]?.text) {
    return { text: data.translations[0].text };
  }
  throw new Error(data.message || 'Ошибка перевода');
}
