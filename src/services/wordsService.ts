import { wordRepository } from 'src/repository/client';
import type { SearchWordsOptions } from 'src/repository/WordRepository';

export async function searchWordsService(userId: string, options: SearchWordsOptions = {}) {
  return wordRepository.searchWords(userId, options);
}

export async function addManyWordService(
  userId: string,
  words: Array<{ word: string; translate: string; languageCode?: string }>
) {
  return wordRepository.addManyWord(userId, words);
}
