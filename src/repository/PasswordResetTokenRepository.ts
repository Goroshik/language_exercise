import { PrismaClient } from '../generated/prisma';

export class PasswordResetTokenRepository {
  private client: PrismaClient['passwordResetToken'];

  constructor(client: PrismaClient) {
    this.client = client.passwordResetToken;
  }

  async createToken(userId: string, token: string, expiresAt: Date) {
    return this.client.create({
      data: {
        userId,
        token,
        expiresAt
      }
    });
  }

  async findValidToken(token: string) {
    return this.client.findFirst({
      where: {
        token,
        used: false,
        expiresAt: {
          gte: new Date()
        }
      },
      include: {
        user: true
      }
    });
  }

  async markTokenAsUsed(token: string) {
    return this.client.updateMany({
      where: { token },
      data: { used: true }
    });
  }

  async deleteExpiredTokens() {
    return this.client.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
  }
}
