import { PrismaClient } from '../generated/prisma';

export class UserSettingsRepository {
  private client: PrismaClient['userSettings'];

  constructor(client: PrismaClient) {
    this.client = client.userSettings;
  }

  async create(data: {
    userId: string;
    theme?: string;
    aiModel?: string;
    language?: string;
    translationLang?: string;
    learningLanguage?: string;
    lastChatId?: string;
    customSettings?: any;
  }) {
    return this.client.create({ data });
  }

  async findByUserId(userId: string) {
    return this.client.findUnique({
      where: { userId }
    });
  }

  async update(
    userId: string,
    data: {
      theme?: string;
      aiModel?: string;
      language?: string;
      translationLang?: string;
      learningLanguage?: string;
      lastChatId?: string;
      customSettings?: any;
    }
  ) {
    return this.client.update({
      where: { userId },
      data
    });
  }

  async upsert(
    userId: string,
    data: {
      theme?: string;
      aiModel?: string;
      language?: string;
      translationLang?: string;
      learningLanguage?: string;
      lastChatId?: string;
      customSettings?: any;
    }
  ) {
    const settings = {
      theme: data.theme,
      aiModel: data.aiModel,
      language: data.language,
      translationLang: data.translationLang,
      learningLanguage: data.learningLanguage,
      lastChatId: data.lastChatId
    };

    return this.client.upsert({
      where: { userId },
      create: { userId, ...settings },
      update: settings
    });
  }

  async updateLastChatId(userId: string, chatId: string) {
    return this.client.update({
      where: { userId },
      data: { lastChatId: chatId }
    });
  }

  async delete(userId: string) {
    return this.client.delete({ where: { userId } });
  }
}
