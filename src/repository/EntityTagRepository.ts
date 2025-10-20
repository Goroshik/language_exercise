import { PrismaClient } from '../generated/prisma';

export class EntityTagRepository {
  private client: PrismaClient['entityTag'];

  constructor(client: PrismaClient) {
    this.client = client.entityTag;
  }

  async create(data: { entityType: string; entityId: string; tagId: string }) {
    return this.client.create({ data });
  }

  async delete(id: string) {
    return this.client.delete({ where: { id } });
  }
}
