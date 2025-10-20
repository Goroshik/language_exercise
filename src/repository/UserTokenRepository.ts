import { PrismaClient } from '../generated/prisma';
import { encrypt, decrypt } from '../utils/crypto';

export class UserTokenRepository {
  private client: PrismaClient['userToken'];

  constructor(client: PrismaClient) {
    this.client = client.userToken;
  }

  async create(data: { userId: string; service: string; token: string }) {
    const encryptedToken = encrypt(data.token);
    return this.client.create({
      data: {
        userId: data.userId,
        service: data.service,
        encryptedToken
      }
    });
  }

  async findByUserAndService(userId: string, service: string) {
    const token = await this.client.findUnique({
      where: { userId_service: { userId, service } }
    });

    console.log('token', userId, service, token);

    if (token) {
      const { encryptedToken, ...data } = token;
      try {
        return {
          ...data,
          token: decrypt(token.encryptedToken)
        };
      } catch (err) {
        return {
          ...token,
          token: null,
          error: err instanceof Error ? err.message : String(err)
        };
      }
    }

    return null;
  }

  async findByUser(userId: string) {
    const tokens = await this.client.findMany({
      where: { userId }
    });
    return tokens.map(token => ({
      ...token,
      token: decrypt(token.encryptedToken)
    }));
  }

  async update(id: string, token: string) {
    const encryptedToken = encrypt(token);
    return this.client.update({
      where: { id },
      data: { encryptedToken }
    });
  }

  async upsert(userId: string, service: string, token: string) {
    const encryptedToken = encrypt(token);

    return this.client.upsert({
      where: {
        userId_service: {
          userId,
          service
        }
      },
      create: {
        userId,
        service,
        encryptedToken
      },
      update: {
        encryptedToken
      }
    });
  }

  async delete(id: string) {
    return this.client.delete({ where: { id } });
  }

  async deleteByUserAndService(userId: string, service: string) {
    return this.client.delete({
      where: {
        userId_service: {
          userId,
          service
        }
      }
    });
  }
}
