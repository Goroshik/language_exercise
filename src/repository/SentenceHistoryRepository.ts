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
    const result = await this.client.create({
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
    return result;
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
    if (sentences.length === 0) return [];

    const createdSentences = await Promise.all(
      sentences.map(s =>
        this.client.create({
          data: {
            ...s,
            mode: s.mode || 'exercise'
          }
        })
      )
    );

    return createdSentences;
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
}
