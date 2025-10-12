import { PrismaClient } from '../generated/prisma';

export class TagRepository {
  private client: PrismaClient;

  constructor(client: PrismaClient) {
    this.client = client;
  }

  async create(data: { name: string; color?: string; backgroudColor?: string; borderColor?: string; ownerId?: string }) {
    return this.client.tag.create({ data });
  }

  async findById(id: string) {
    return this.client.tag.findUnique({ where: { id } });
  }

  async findByName(name: string) {
    return this.client.tag.findUnique({ where: { name } });
  }

  async findAll(ownerId?: string) {
    return this.client.tag.findMany({
      where: ownerId ? { ownerId } : undefined,
    });
  }

  async update(id: string, data: { name?: string; color?: string; backgroudColor?: string; borderColor?: string }) {
    return this.client.tag.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.client.tag.delete({ where: { id } });
  }
}
