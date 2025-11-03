import { PrismaClient, Prisma } from 'src/generated/prisma/client';

export class SentenceHistoryRepository {
  private client: PrismaClient['sentenceHistory'];

  constructor(client: PrismaClient) {
    this.client = client.sentenceHistory;
  }

  async addHistory({
    ownerId,
    sentence,
    languageId,
    usedWordIds,
    level,
    mode = 'exercise',
    topic
  }: {
    ownerId: string;
    sentence: string;
    languageId: string;
    usedWordIds: string[];
    level: string;
    mode?: string;
    topic?: string;
  }) {
    return this.client.create({
      data: {
        ownerId,
        sentence,
        languageId,
        usedWordIds,
        level,
        mode,
        topic
      }
    });
  }

  async addHistoryBatch(
    sentences: {
      ownerId: string;
      sentence: string;
      languageId: string;
      usedWordIds: string[];
      level: string;
      mode?: string;
      topic?: string;
    }[]
  ) {
    if (sentences.length === 0) return { count: 0 };

    return this.client.createMany({
      data: sentences.map(s => ({
        ...s,
        mode: s.mode || 'exercise'
      }))
    });
  }

  async getHistory({
    ownerId,
    languageId,
    level,
    usedWordIds,
    searchText
  }: {
    ownerId: string;
    languageId?: string;
    level?: string;
    usedWordIds?: string[];
    searchText?: string;
  }) {
    const where: Prisma.SentenceHistoryWhereInput = {
      ownerId
    };

    if (languageId) where.languageId = languageId;
    if (level) where.level = level;
    if (usedWordIds && usedWordIds.length > 0) {
      where.usedWordIds = { hasSome: usedWordIds };
    }
    if (searchText) {
      where.sentence = { contains: searchText, mode: 'insensitive' };
    }
    return this.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        language: true
      }
    });
  }

  async getRandomSentencesByTopicAndLevel({
    ownerId,
    topic,
    languageId,
    level,
    limit = 5
  }: {
    ownerId: string;
    topic: string;
    languageId: string;
    level: string;
    limit?: number;
  }) {
    const where: Prisma.SentenceHistoryWhereInput = {
      ownerId,
      languageId,
      level,
      topic
    };

    // Get all matching sentences
    const allSentences = await this.client.findMany({
      where,
      include: {
        language: true
      }
    });

    // Shuffle and take the requested number
    const shuffled = allSentences.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  }

  async countSentencesByTopicAndLevel({
    ownerId,
    topic,
    languageId,
    level
  }: {
    ownerId: string;
    topic: string;
    languageId: string;
    level: string;
  }) {
    return this.client.count({
      where: {
        ownerId,
        languageId,
        level,
        topic
      }
    });
  }
}
