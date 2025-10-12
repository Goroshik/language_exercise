import {PrismaClient} from '../generated/prisma/client';

const prisma = new PrismaClient();

export class GeneratedSentenceHistoryRepository {
  static async addHistory({ownerId, sentence, language, usedWordIds, level}: {
    ownerId: string;
    sentence: string;
    language: string;
    usedWordIds: string[];
    level: string;
  }) {
    return prisma.generatedSentenceHistory.create({
      data: {
        ownerId,
        sentence,
        language,
        usedWordIds,
        level,
      },
    });
  }

  static async getHistory({language, level, usedWordIds}: {
    language?: string;
    level?: string;
    usedWordIds?: string[];
  }) {
    const where: any = {};
    if (language) where.language = language;
    if (level) where.level = level;
    if (usedWordIds && usedWordIds.length > 0) {
      where.usedWordIds = {hasSome: usedWordIds};
    }
    return prisma.generatedSentenceHistory.findMany({
      where,
      orderBy: {createdAt: 'desc'},
    });
  }
}

