import { PrismaClient } from 'src/generated/prisma/client';

export class UserAnswerRepository {
  private client: PrismaClient['userAnswer'];

  constructor(client: PrismaClient) {
    this.client = client.userAnswer;
  }

  async saveAnswer({
    userId,
    sentenceId,
    answer
  }: {
    userId: string;
    sentenceId: string;
    answer: string;
  }) {
    return this.client.upsert({
      where: {
        userId_sentenceId: {
          userId,
          sentenceId
        }
      },
      update: {
        answer,
        updatedAt: new Date()
      },
      create: {
        userId,
        sentenceId,
        answer
      }
    });
  }

  async getAnswersBySentenceIds({
    userId,
    sentenceIds
  }: {
    userId: string;
    sentenceIds: string[];
  }) {
    return this.client.findMany({
      where: {
        userId,
        sentenceId: { in: sentenceIds }
      }
    });
  }

  async getAnswer({
    userId,
    sentenceId
  }: {
    userId: string;
    sentenceId: string;
  }) {
    return this.client.findUnique({
      where: {
        userId_sentenceId: {
          userId,
          sentenceId
        }
      }
    });
  }

  async deleteAnswer({
    userId,
    sentenceId
  }: {
    userId: string;
    sentenceId: string;
  }) {
    return this.client.delete({
      where: {
        userId_sentenceId: {
          userId,
          sentenceId
        }
      }
    });
  }
}
