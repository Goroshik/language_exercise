import { wordRepository } from 'src/repository/client';
import { DictionaryWord } from 'src/types';

export async function updateWordService(
  userId: string,
  id: string,
  word: string,
  translate: string,
  createdAt?: Date
) {
  const updatedWord: DictionaryWord = {
    id,
    word: word.trim(),
    translate: translate.trim(),
    createdAt: createdAt || new Date()
  };
  await wordRepository.updateWord(userId, updatedWord);
  return updatedWord;
}

export async function deleteWordService(userId: string, id: string) {
  await wordRepository.deleteWord(userId, id);
  return id;
}
