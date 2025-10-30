import { PrismaClient } from 'src/generated/prisma/client';

export class ChatMessageRepository {
  private client: PrismaClient['chatMessage'];

  constructor(client: PrismaClient) {
    this.client = client.chatMessage;
  }

  async addMessage({ userId, role, content }: { userId: string; role: string; content: string }) {
    return this.client.create({
      data: {
        userId,
        role,
        content
      }
    });
  }

  async getMessages({ userId, limit = 50 }: { userId: string; limit?: number }) {
    return this.client.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: limit
    });
  }

  async deleteAllMessages(userId: string) {
    return this.client.deleteMany({
      where: { userId }
    });
  }
}
