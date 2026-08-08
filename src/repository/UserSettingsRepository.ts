import { omitUndefined } from 'src/utils/omitUndefined';
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
    lastSelectedTopic?: string;
    lastSelectedLevel?: string;
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
      lastSelectedTopic?: string;
      lastSelectedLevel?: string;
    }
  ) {
    console.log('UserSettingsRepository.update - userId:', userId, 'data:', data);
    try {
      const result = await this.client.update({
        where: { userId },
        data
      });
      console.log('UserSettingsRepository.update - success:', result);
      return result;
    } catch (error) {
      console.error('UserSettingsRepository.update - error:', error);
      throw error;
    }
  }

  async upsert(
    userId: string,
    data: {
      theme?: string;
      aiModel?: string;
      language?: string;
      translationLang?: string;
      learningLanguage?: string;
      lastSelectedTopic?: string;
      lastSelectedLevel?: string;
    }
  ) {
    const settings = omitUndefined({
      theme: data.theme,
      aiModel: data.aiModel,
      language: data.language,
      translationLang: data.translationLang,
      learningLanguage: data.learningLanguage,
      lastSelectedTopic: data.lastSelectedTopic,
      lastSelectedLevel: data.lastSelectedLevel
    });

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

  /**
   * Get topic for specific language
   */
  async getTopicForLanguage(userId: string, languageCode: string): Promise<string | null> {
    const settings = await this.findByUserId(userId);
    if (!settings?.topicsByLanguage) return null;

    const topics = settings.topicsByLanguage as Record<string, string>;
    return topics[languageCode] || null;
  }

  /**
   * Set topic for specific language
   */
  async setTopicForLanguage(userId: string, languageCode: string, topic: string) {
    const settings = await this.findByUserId(userId);
    const topics = (settings?.topicsByLanguage as Record<string, string>) || {};

    topics[languageCode] = topic;

    return this.client.update({
      where: { userId },
      data: { topicsByLanguage: topics }
    });
  }

  /**
   * Get level for specific language
   */
  async getLevelForLanguage(userId: string, languageCode: string): Promise<string | null> {
    const settings = await this.findByUserId(userId);
    if (!settings?.levelsByLanguage) return null;

    const levels = settings.levelsByLanguage as Record<string, string>;
    return levels[languageCode] || null;
  }

  /**
   * Set level for specific language
   */
  async setLevelForLanguage(userId: string, languageCode: string, level: string) {
    const settings = await this.findByUserId(userId);
    const levels = (settings?.levelsByLanguage as Record<string, string>) || {};

    levels[languageCode] = level;

    return this.client.update({
      where: { userId },
      data: { levelsByLanguage: levels }
    });
  }

  async delete(userId: string) {
    return this.client.delete({ where: { userId } });
  }
}
