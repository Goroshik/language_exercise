import { Prisma, PrismaClient } from 'src/generated/prisma/client';
import { prisma } from './client';

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
    return prisma.$transaction(sentences.map(sentenceData => 
      this.client.create({ data: sentenceData, select: { id: true } })
    ));
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
    limit = 5,
    excludeSentenceIds = []
  }: {
    ownerId: string;
    topic: string;
    languageId: string;
    level: string;
    limit?: number;
    excludeSentenceIds?: string[];
  }) {
    const where: Prisma.SentenceHistoryWhereInput = {
      ownerId,
      languageId,
      level,
      topic
    };

    // Exclude sentences that user already answered
    if (excludeSentenceIds.length > 0) {
      where.id = { notIn: excludeSentenceIds };
    }

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
    level,
    excludeSentenceIds = []
  }: {
    ownerId: string;
    topic: string;
    languageId: string;
    level: string;
    excludeSentenceIds?: string[];
  }) {
    const where: Prisma.SentenceHistoryWhereInput = {
      ownerId,
      languageId,
      level,
      topic
    };

    // Exclude sentences that are already displayed
    if (excludeSentenceIds.length > 0) {
      where.id = { notIn: excludeSentenceIds };
    }

    return this.client.count({ where });
  }
}
