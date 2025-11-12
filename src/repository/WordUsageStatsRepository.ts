import { PrismaClient } from '../generated/prisma';

export class WordUsageStatsRepository {
  private client: PrismaClient['wordUsageStats'];

  constructor(client: PrismaClient) {
    this.client = client.wordUsageStats;
  }

  /**
   * Increment usage count for a word
   */
  async incrementUsage(userId: string, wordId: string): Promise<void> {
    const existing = await this.client.findUnique({
      where: {
        userId_wordId: {
          userId,
          wordId
        }
      }
    });

    if (existing) {
      await this.client.update({
        where: {
          userId_wordId: {
            userId,
            wordId
          }
        },
        data: {
          count: existing.count + 1,
          lastUsedAt: new Date()
        }
      });
    } else {
      await this.client.create({
        data: {
          userId,
          wordId,
          count: 1,
          lastUsedAt: new Date()
        }
      });
    }
  }

  /**
   * Increment usage count for multiple words at once
   */
  async incrementUsageForWords(userId: string, wordIds: string[]): Promise<void> {
    // Process each word individually since MongoDB doesn't support batch upsert well
    await Promise.all(wordIds.map(wordId => this.incrementUsage(userId, wordId)));
  }

  /**
   * Get usage statistics for a specific word
   */
  async getUsageStats(userId: string, wordId: string) {
    return this.client.findUnique({
      where: {
        userId_wordId: {
          userId,
          wordId
        }
      }
    });
  }

  /**
   * Get usage statistics for multiple words
   */
  async getUsageStatsForWords(userId: string, wordIds: string[]) {
    return this.client.findMany({
      where: {
        userId,
        wordId: { in: wordIds }
      }
    });
  }

  /**
   * Get all usage statistics for a user, optionally ordered by count
   */
  async getAllUsageStats(userId: string, orderByCount = false) {
    return this.client.findMany({
      where: { userId },
      orderBy: orderByCount ? { count: 'desc' } : { lastUsedAt: 'desc' },
      include: {
        word: true
      }
    });
  }

  /**
   * Get usage count for a specific word
   */
  async getUsageCount(userId: string, wordId: string): Promise<number> {
    const stats = await this.getUsageStats(userId, wordId);
    return stats?.count || 0;
  }
}
