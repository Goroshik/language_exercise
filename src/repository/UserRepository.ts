import { PrismaClient } from '../generated/prisma';

export class UserRepository {
  private client: PrismaClient['user'];

  constructor(client: PrismaClient) {
    this.client = client.user;
  }

  async getUserByEmail(email: string) {
    return this.client.findUnique({
      where: { email }
    });
  }
}
