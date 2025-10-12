import client from './client';
import {Prisma} from "src/generated/prisma";

export class UserSettingsRepository {
  private client = client.userSettings;

  constructor() {
  }

  public async findByUserId(userId: string) {
    return this.client.findUnique({
      where: {userId},
      select: {
        id: true,
        theme: true,
        aiModel: true,
        language: true,
        translationLang: true,
        customSettings: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  public async create(userId: string, data: Omit<Prisma.UserSettingsUncheckedCreateInput, 'userId'>) {
    return this.client.create({
      data: {
        userId,
        ...data
      }
    });
  }

  public async update(userId: string, data: Prisma.UserSettingsUpdateInput) {
    return this.client.update({
      where: {userId},
      data
    });
  }

  public async upsert(userId: string, data: Omit<Prisma.UserSettingsUncheckedCreateInput, 'userId'>) {
    return this.client.upsert({
      where: {userId},
      update: data,
      create: {
        userId,
        ...data
      }
    });
  }

  public async delete(userId: string) {
    return this.client.delete({
      where: {userId}
    });
  }
}

export const userSettingsRepository = new UserSettingsRepository();
