import {PrismaClient} from '../generated/prisma';

export class UserRepository {
  private client: PrismaClient;

  constructor(client: PrismaClient) {
    this.client = client;
  }

  async getUserByEmail(email: string) {
    return this.client.user.findUnique({
      where: {email},
    });
  }
}
