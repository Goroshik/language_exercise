import { PrismaClient } from '../generated/prisma';

export class EntityTagRepository {
  private client: PrismaClient;

  constructor(client: PrismaClient) {
    this.client = client;
  }

  async create(data: { entityType: string; entityId: string; tagId: string }) {
    return this.client.entityTag.create({ data });
  }

  async findById(id: string) {
    return this.client.entityTag.findUnique({ where: { id } });
  }

  async findByEntity(entityType: string, entityId: string) {
    return this.client.entityTag.findMany({
      where: { entityType, entityId },
      include: { tag: true },
    });
  }

  async findByTag(tagId: string) {
    return this.client.entityTag.findMany({
      where: { tagId },
    });
  }

  async delete(id: string) {
    return this.client.entityTag.delete({ where: { id } });
  }
}
