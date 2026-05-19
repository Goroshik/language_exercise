import { PrismaClient } from 'src/generated/prisma';

export class ChatMessageRepository {
  private client: PrismaClient['chatMessage'];

  constructor(client: PrismaClient) {
    this.client = client.chatMessage;
  }

  async addMessage({
    userId,
    chatId,
    role,
    content
  }: {
    userId: string;
    chatId: string;
    role: string;
    content: string;
  }) {
    return this.client.create({
      data: {
        userId,
        chatId,
        role,
        content
      }
    });
  }

  async getMessages({
    userId,
    chatId,
    limit = 50
  }: {
    userId: string;
    chatId: string;
    limit?: number;
  }) {
    return this.client.findMany({
      where: { userId, chatId },
      orderBy: { createdAt: 'asc' },
      take: limit
    });
  }

  async deleteAllMessages(userId: string, chatId: string) {
    return this.client.deleteMany({
      where: { userId, chatId }
    });
  }

  async deleteChatById(userId: string, chatId: string) {
    return this.client.deleteMany({
      where: { userId, chatId }
    });
  }

  async getAllChats(userId: string) {
    const messages = await this.client.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      distinct: ['chatId']
    });

    return Array.from(new Set(messages.map(m => m.chatId)));
  }
}
