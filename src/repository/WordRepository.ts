import {PrismaClient} from '../generated/prisma';

export class WordRepository {
  private client: PrismaClient;

  constructor(client: PrismaClient) {
    this.client = client;
  }

  async create(data: { word: string; translate: string; ownerId?: string; shared?: boolean }) {
    return this.client.word.create({data});
  }

  async findById(id: string) {
    return this.client.word.findUnique({where: {id}});
  }

  async findAll(filters?: { ownerId?: string; shared?: boolean }) {
    return this.client.word.findMany({
      where: filters,
    });
  }

  async update(id: string, data: { word?: string; translate?: string; shared?: boolean }) {
    return this.client.word.update({where: {id}, data});
  }

  async delete(id: string) {
    return this.client.word.delete({where: {id}});
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

    return this.client.word.findMany({where, orderBy: {createdAt: 'desc'}});
  }

  async addWord(userId: string, data: { word: string; translate: string; createdAt?: Date; shared?: boolean }) {
    return this.client.word.create({
      data: {
        ...data,
        ownerId: userId
      }
    });
  }

  async addManyWord(userId: string, data: { word: string; translate: string; createdAt?: Date; shared?: boolean }[]) {
    return this.client.word.createMany({
      data: data.map((word) => ({...word, ownerId: userId}))
    });
  }

  async getAllWords(userId: string) {
    return this.client.word.findMany({
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
    return this.client.word.update({
      where: {id: word.id},
      data: {
        word: word.word,
        translate: word.translate,
        shared: word.shared
      }
    });
  }

  async deleteWord(userId: string, wordId: string) {
    return this.client.word.delete({
      where: {id: wordId}
    });
  }
}
