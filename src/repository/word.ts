import {Prisma} from 'src/generated/prisma';
import {DictionaryWord} from 'src/types';

import client from './client';

export class WordRepository {
  private client = client.word;

  public async addWord(userId: string, word: Prisma.WordCreateInput) {
    const createdWord = await this.client.create({
      data: {
        ...word,
        ownerId: userId
      }
    });

    return createdWord;
  }

  public async updateWord(userId: string, word: DictionaryWord) {
    // Проверяем, что пользователь является владельцем слова
    const existingWord = await this.client.findFirst({
      where: { id: word.id, ownerId: userId }
    });

    if (!existingWord) {
      throw new Error('Word not found or access denied');
    }

    await this.client.update({
      where: {id: word.id},
      data: word
    });
  }

  public async deleteWord(userId: string, id: string) {
    // Проверяем, что пользователь является владельцем слова
    const existingWord = await this.client.findFirst({
      where: { id, ownerId: userId }
    });

    if (!existingWord) {
      throw new Error('Word not found or access denied');
    }

    return this.client.delete({where: {id}});
  }

  public async getAllWords(userId: string) {
    const words = await this.client.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { shared: true }
        ]
      }
    });
    return words;
  }

  public async searchWords(userId: string, query: string = '') {
    const whereCondition: Prisma.WordWhereInput = {
      OR: [
        { ownerId: userId },
        { shared: true }
      ]
    };

    if (query) {
      whereCondition.AND = [
        {
          OR: [
            {word: {contains: query, mode: 'insensitive'}},
            {translate: {contains: query, mode: 'insensitive'}}
          ]
        }
      ];
    }

    const words = await this.client.findMany({
      where: whereCondition
    });

    return words;
  }

  public async createMany(userId: string, words: DictionaryWord[]) {
    const wordsWithOwner = words.map(word => ({
      ...word,
      ownerId: userId
    }));

    return this.client.createMany({
      data: wordsWithOwner
    })
  }
}

export const wordRepository = new WordRepository();
