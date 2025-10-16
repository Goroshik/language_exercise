import {PrismaClient} from '../generated/prisma';

export class WordRepository {
  private client: PrismaClient['word'];

  constructor(client: PrismaClient) {
    this.client = client.word;
  }

  async create(data: { word: string; translate: string; ownerId?: string; shared?: boolean }) {
    return this.client.create({data});
  }


  async update(id: string, data: { word?: string; translate?: string; shared?: boolean }) {
    return this.client.update({where: {id}, data});
  }

  async delete(id: string) {
    return this.client.delete({where: {id}});
  }

  async searchWords(userId: string, query: string) {
    const where: any = {
      ownerId: userId
    };

    if (query) {
      where.OR = [
        {word: {contains: query, mode: 'insensitive'}},
        {translate: {contains: query, mode: 'insensitive'}}
      ];
    }

    return this.client.findMany({where, orderBy: {createdAt: 'desc'}});
  }

  async addWord(userId: string, data: { word: string; translate: string; createdAt?: Date; shared?: boolean }) {
    return this.client.create({
      data: {
        ...data,
        ownerId: userId
      }
    });
  }

  async addManyWord(userId: string, data: { word: string; translate: string; createdAt?: Date; shared?: boolean }[]) {
    return this.client.createMany({
      data: data.map((word) => ({...word, ownerId: userId}))
    });
  }

  async getAllWords(userId: string) {
    return this.client.findMany({
      where: {ownerId: userId},
      orderBy: {createdAt: 'desc'}
    });
  }

  async updateWord(userId: string, word: {
    id: string;
    word: string;
    translate: string;
    createdAt?: Date;
    shared?: boolean
  }) {
    return this.client.update({
      where: {id: word.id, ownerId: userId},
      data: {
        word: word.word,
        translate: word.translate,
        shared: word.shared
      }
    });
  }

  async deleteWord(userId: string, wordId: string) {
    return this.client.delete({
      where: {id: wordId, ownerId: userId}
    });
  }
}
