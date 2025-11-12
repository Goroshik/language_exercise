import { wordRepository } from 'src/repository/client';

export async function searchWordsService(
  userId: string, 
  query: string, 
  languageCode?: string,
  limit?: number,
  page?: number,
  sortByUsage: boolean = false
) {
  return wordRepository.searchWords(userId, query, languageCode, limit, page, sortByUsage);
}

export async function addManyWordService(
  userId: string,
  words: Array<{ word: string; translate: string; languageCode?: string }>
) {
  return wordRepository.addManyWord(userId, words);
}
