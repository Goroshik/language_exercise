import { wordRepository } from 'src/repository/client';

export async function searchWordsService(userId: string, query: string) {
  return wordRepository.searchWords(userId, query);
}

// TODO: need to fix any type
export async function addManyWordService(userId: string, words: any[]) {
  return wordRepository.addManyWord(userId, words);
}
