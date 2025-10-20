import { PrismaClient } from '../generated/prisma';

export class TagRepository {
  private client: PrismaClient['tag'];

  constructor(client: PrismaClient) {
    this.client = client.tag;
  }

  async create(data: {
    name: string;
    color?: string;
    backgroudColor?: string;
    borderColor?: string;
    ownerId?: string;
  }) {
    return this.client.create({ data });
  }

  async update(
    id: string,
    data: { name?: string; color?: string; backgroudColor?: string; borderColor?: string }
  ) {
    return this.client.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.client.delete({ where: { id } });
  }
}
