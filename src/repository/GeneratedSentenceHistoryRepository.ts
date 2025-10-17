import {PrismaClient, Prisma} from 'src/generated/prisma/client';


export class GeneratedSentenceHistoryRepository {
  private client: PrismaClient['sentenceHistory'];

  constructor(client: PrismaClient) {
    this.client = client.sentenceHistory;
  }

  async addHistory({ownerId, sentence, language, usedWordIds, level}: {
    ownerId: string;
    sentence: string;
    language: string;
    usedWordIds: string[];
    level: string;
  }) {
    return this.client.create({
      data: {
        ownerId,
        sentence,
        language,
        usedWordIds,
        level,
      },
    });
  }

  async addHistoryBatch(sentences: {
    ownerId: string;
    sentence: string;
    language: string;
    usedWordIds: string[];
    level: string;
  }[]) {
    if (sentences.length === 0) return {count: 0};

    return this.client.createMany({
      data: sentences,
    });
  }

  async getHistory({ownerId, language, level, usedWordIds, searchText}: {
    ownerId: string;
    language?: string;
    level?: string;
    usedWordIds?: string[];
    searchText?: string;
  }) {
    const where: Prisma.SentenceHistoryWhereInput = {
      ownerId,
    };

    if (language) where.language = language;
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
    });
  }
}

