import {PrismaClient} from '../generated/prisma';

export class UserSettingsRepository {
  private client: PrismaClient;

  constructor(client: PrismaClient) {
    this.client = client;
  }

  async create(data: {
    userId: string;
    theme?: string;
    aiModel?: string;
    language?: string;
    translationLang?: string;
    customSettings?: any;
  }) {
    return this.client.userSettings.create({data});
  }

  async findById(id: string) {
    return this.client.userSettings.findUnique({where: {id}});
  }

  async findByUserId(userId: string) {
    return this.client.userSettings.findUnique({
      where: {userId},
    });
  }

  async update(
    userId: string,
    data: {
      theme?: string;
      aiModel?: string;
      language?: string;
      translationLang?: string;
      customSettings?: any;
    }
  ) {
    return this.client.userSettings.update({
      where: {userId},
      data,
    });
  }

  async upsert(
    userId: string,
    data: {
      theme?: string;
      aiModel?: string;
      language?: string;
      translationLang?: string;
      customSettings?: any;
    }
  ) {
    const existing = await this.client.userSettings.findUnique({
      where: {userId}
    })

    if (existing) {
      return this.client.userSettings.update({
        where: {userId},
        data,
      })
    } else {
      return this.client.userSettings.create({
        data: {userId, ...data}
      })
    }
  }

  async delete(userId: string) {
    return this.client.userSettings.delete({where: {userId}});
  }
}
