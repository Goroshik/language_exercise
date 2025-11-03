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
      customSettings?: any;
    }
  ) {
    const settings = {
      theme: data.theme,
      aiModel: data.aiModel,
      language: data.language,
      translationLang: data.translationLang,
      learningLanguage: data.learningLanguage
    };

    return this.client.upsert({
      where: { userId },
      create: { userId, ...settings },
      update: settings
    });
  }

  /**
   * Get chat ID for specific language
   */
  async getChatIdForLanguage(userId: string, languageCode: string): Promise<string | null> {
    const settings = await this.findByUserId(userId);
    if (!settings?.chatIdsByLanguage) return null;

    const chatIds = settings.chatIdsByLanguage as Record<string, string>;
    return chatIds[languageCode] || null;
  }

  /**
   * Set chat ID for specific language
   */
  async setChatIdForLanguage(userId: string, languageCode: string, chatId: string) {
    const settings = await this.findByUserId(userId);
    const chatIds = (settings?.chatIdsByLanguage as Record<string, string>) || {};

    chatIds[languageCode] = chatId;

    return this.client.update({
      where: { userId },
      data: { chatIdsByLanguage: chatIds }
    });
  }

  async delete(userId: string) {
    return this.client.delete({ where: { userId } });
  }
}
