import { wordRepository } from 'src/repository/client';
import { DictionaryWord } from 'src/types';

export interface UpdateWordInput {
  id: string;
  word: string;
  translate: string;
  createdAt?: Date | undefined;
}

export async function updateWordService(userId: string, input: UpdateWordInput) {
  const updatedWord: DictionaryWord = {
    id: input.id,
    word: input.word.trim(),
    translate: input.translate.trim(),
    createdAt: input.createdAt || new Date()
  };
  await wordRepository.updateWord(userId, updatedWord);
  return updatedWord;
}

export async function deleteWordService(userId: string, id: string) {
  await wordRepository.deleteWord(userId, id);
  return id;
}
