import { PrismaClient } from '../generated/prisma';

export class WordRepository {
  private client: PrismaClient['word'];
  private prisma: PrismaClient;

  constructor(client: PrismaClient) {
    this.client = client.word;
    this.prisma = client;
  }

  async create(data: { word: string; translate: string; ownerId?: string; shared?: boolean }) {
    return this.client.create({ data });
  }

  async update(id: string, data: { word?: string; translate?: string; shared?: boolean }) {
    return this.client.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.client.delete({ where: { id } });
  }

  async searchWords(
    userId: string, 
    query: string, 
    languageCode?: string, 
    limit?: number,
    page?: number,
    sortByUsage: boolean = false
  ) {
    // TODO: Fix types - create proper Prisma where clause type instead of using any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      ownerId: userId
    };

    // Filter by language if provided
    if (languageCode) {
      where.languageCode = languageCode;
    }

    if (query) {
      where.OR = [
        { word: { contains: query, mode: 'insensitive' } },
        { translate: { contains: query, mode: 'insensitive' } }
      ];
    }

    // Get total count for pagination
    const total = await this.client.count({ where });

    if (sortByUsage) {
      const usageStats = await this.prisma.wordUsageStats.findMany({
        where: {
          userId,
          word: where
        },
        select: {
          wordId: true,
          count: true
        },
        orderBy: {
          count: 'asc',
        }
      });

      const usedWordIds = usageStats.map(stat => stat.wordId);

      const unusedWords = await this.client.findMany({
        where: {
          ...where,
          id: { notIn: usedWordIds }
        },
        select: { id: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
      });

      const unusedWordIds = unusedWords.map(w => w.id);

      const finalWordIds = [...unusedWordIds, ...usedWordIds];

      let paginatedIds = finalWordIds;
      if (limit !== undefined && page !== undefined) {
        const skip = (page - 1) * limit;
        paginatedIds = finalWordIds.slice(skip, skip + limit);
      } else if (limit !== undefined) {
        paginatedIds = finalWordIds.slice(0, limit);
      }

      const words = await this.client.findMany({
        where: { id: { in: paginatedIds },  },
        include: { usageStats: { select: { count: true}, take: 1},  }
      });

      const orderedWords = paginatedIds.map(id => 
        words.find(word => word.id === id)
      ).filter(Boolean);

      return { words: orderedWords, total };
    }

    const findOptions = {
      where,
      orderBy: { createdAt: 'desc' as const },
      skip: 0,
      take: undefined as number | undefined
    };


    if(limit !== undefined && page !== undefined) {
      findOptions.skip = (page - 1) * limit;
      findOptions.take = limit;
    }

    const words = await this.client.findMany({ ...findOptions, include: { usageStats: { select: { count: true}, take: 1},  } });

    return { words, total };
  }

  async addWord(
    userId: string,
    data: {
      word: string;
      translate: string;
      languageCode?: string;
      createdAt?: Date;
      shared?: boolean;
    }
  ) {
    return this.client.create({
      data: {
        ...data,
        ownerId: userId
      }
    });
  }

  async addManyWord(
    userId: string,
    data: {
      word: string;
      translate: string;
      languageCode?: string;
      createdAt?: Date;
      shared?: boolean;
    }[]
  ) {
    return this.client.createMany({
      data: data.map(word => ({ ...word, ownerId: userId }))
    });
  }

  async getAllWords(userId: string, languageCode?: string, sortByUsage: boolean = false) {
    // TODO: Fix types - create proper Prisma where clause type instead of using any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { ownerId: userId };
    if (languageCode) {
      where.languageCode = languageCode;
    }

    if (sortByUsage) {
      const allWords = await this.client.findMany({
        where,
        select: { id: true, createdAt: true }
      });

      const wordIds = allWords.map(w => w.id);

      const usageStats = await this.prisma.wordUsageStats.findMany({
        where: {
          userId,
          wordId: { in: wordIds }
        },
        select: {
          wordId: true,
          count: true
        }
      });

      const statsMap = new Map(
        usageStats.map(stat => [stat.wordId, stat.count])
      );

      const sortedIds = allWords
        .sort((a, b) => {
          const aCount = statsMap.get(a.id) || 0;
          const bCount = statsMap.get(b.id) || 0;
          
          if (aCount !== bCount) {
            return aCount - bCount;
          }

          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
        .map(w => w.id);

      const words = await this.client.findMany({
        where: {
          id: { in: sortedIds }
        }
      });

      const orderedWords = sortedIds.map(id =>
        words.find(word => word.id === id)
      ).filter(Boolean);

      return orderedWords;
    }

    return this.client.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateWord(
    userId: string,
    word: {
      id: string;
      word: string;
      translate: string;
      createdAt?: Date;
      shared?: boolean;
    }
  ) {
    return this.client.update({
      where: { id: word.id, ownerId: userId },
      data: {
        word: word.word,
        translate: word.translate,
        shared: word.shared
      }
    });
  }

  async deleteWord(userId: string, wordId: string) {
    return this.client.delete({
      where: { id: wordId, ownerId: userId }
    });
  }

  async findByWord(userId: string, word: string) {
    return this.client.findFirst({
      where: {
        ownerId: userId,
        word: { equals: word, mode: 'insensitive' }
      }
    });
  }

  async findManyByWords(userId: string, words: string[]) {
    return this.client.findMany({
      where: {
        ownerId: userId,
        OR: words.map(word => ({
          word: { equals: word, mode: 'insensitive' }
        }))
      },
      select: {
        word: true
      }
    });
  }

  /**
   * Get least used words for a user, prioritizing:
   * 1. Words that have never been used (sorted by oldest lastUsedAt/createdAt)
   * 2. Words with lowest usage count (sorted by oldest lastUsedAt)
   */
  async getLeastUsedWords(userId: string, languageCode: string, limit: number) {
    // Get all words for the user in the specified language
    const allWords = await this.client.findMany({
      where: {
        ownerId: userId,
        languageCode: languageCode
      },
      select: { id: true, createdAt: true, word: true, translate: true, languageCode: true }
    });

    if (allWords.length === 0) {
      return [];
    }

    const wordIds = allWords.map(w => w.id);

    // Get usage statistics for all words
    const usageStats = await this.prisma.wordUsageStats.findMany({
      where: {
        userId,
        wordId: { in: wordIds }
      },
      select: {
        wordId: true,
        count: true,
        lastUsedAt: true
      }
    });

    // Create a map for quick lookup
    const statsMap = new Map(
      usageStats.map(stat => [stat.wordId, { count: stat.count, lastUsedAt: stat.lastUsedAt }])
    );

    // Sort words by usage priority
    const sortedWords = allWords.sort((a, b) => {
      const aStats = statsMap.get(a.id);
      const bStats = statsMap.get(b.id);
      
      // Priority 1: Words never used (no stats record)
      if (!aStats && !bStats) {
        // Both never used - sort by creation date (older first)
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (!aStats) return -1; // a has no stats, prioritize it
      if (!bStats) return 1;  // b has no stats, prioritize it
      
      // Priority 2: Words with lower usage count
      if (aStats.count !== bStats.count) {
        return aStats.count - bStats.count; // ASC: lower count first
      }
      
      // Priority 3: Words not used recently (older lastUsedAt)
      return new Date(aStats.lastUsedAt).getTime() - new Date(bStats.lastUsedAt).getTime();
    });

    // Return top N words
    return sortedWords.slice(0, limit);
  }
}
