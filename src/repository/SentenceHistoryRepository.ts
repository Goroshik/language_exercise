import {PrismaClient, Prisma} from 'src/generated/prisma/client';


export class SentenceHistoryRepository {
  private client: PrismaClient['sentenceHistory'];

  constructor(client: PrismaClient) {
    this.client = client.sentenceHistory;
  }

  async addHistory({ownerId, sentence, languageId, usedWordIds, level}: {
    ownerId: string;
    sentence: string;
    languageId: string;
    usedWordIds: string[];
    level: string;
  }) {
    return this.client.create({
      data: {
        ownerId,
        sentence,
        languageId,
        usedWordIds,
        level,
      },
    });
  }

  async addHistoryBatch(sentences: {
    ownerId: string;
    sentence: string;
    languageId: string;
    usedWordIds: string[];
    level: string;
  }[]) {
    if (sentences.length === 0) return {count: 0};

    return this.client.createMany({
      data: sentences,
    });
  }

  async getHistory({ownerId, languageId, level, usedWordIds, searchText}: {
    ownerId: string;
    languageId?: string;
    level?: string;
    usedWordIds?: string[];
    searchText?: string;
  }) {
    const where: Prisma.SentenceHistoryWhereInput = {
      ownerId,
    };

    if (languageId) where.languageId = languageId;
    if (level) where.level = level;
    if (usedWordIds && usedWordIds.length > 0) {
      where.usedWordIds = {hasSome: usedWordIds};
    }
    if (searchText) {
      where.sentence = {contains: searchText, mode: 'insensitive'};
    }
    return this.client.findMany({
      where,
      orderBy: {createdAt: 'desc'},
      include: {
        language: true,
      },
    });
  }
}

