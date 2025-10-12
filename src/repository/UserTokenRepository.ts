import {PrismaClient} from '../generated/prisma';
import {encrypt, decrypt} from '../utils/crypto';

export class UserTokenRepository {
  private client: PrismaClient;

  constructor(client: PrismaClient) {
    this.client = client;
  }

  async create(data: { userId: string; service: string; token: string }) {
    const encryptedToken = encrypt(data.token);
    return this.client.userToken.create({
      data: {
        userId: data.userId,
        service: data.service,
        encryptedToken,
      },
    });
  }

  async findById(id: string) {
    const token = await this.client.userToken.findUnique({where: {id}});
    if (token) {
      try {
        return {
          ...token,
          token: decrypt(token.encryptedToken),
        };
      } catch (err) {
        return {
          ...token,
          token: null,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }
    return null;
  }

  async findByUserAndService(userId: string, service: string) {
    const token = await this.client.userToken.findUnique({
      where: {userId_service: {userId, service}},
    });

    console.log('token', userId, service, token)

    if (token) {
      const {encryptedToken, ...data} = token
      try {
        return {
          ...data,
          token: decrypt(token.encryptedToken),
        };
      } catch (err) {
        return {
          ...token,
          token: null,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }

    return null;
  }

  async findByUser(userId: string) {
    const tokens = await this.client.userToken.findMany({
      where: {userId},
    });
    return tokens.map(token => ({
      ...token,
      token: decrypt(token.encryptedToken),
    }));
  }

  async update(id: string, token: string) {
    const encryptedToken = encrypt(token);
    return this.client.userToken.update({
      where: {id},
      data: {encryptedToken},
    });
  }

  async upsert(userId: string, service: string, token: string) {
    const encryptedToken = encrypt(token);

    const existing = await this.client.userToken.findUnique({
      where: {
        userId_service: {
          userId,
          service
        }
      },
      select: {
        id: true,
      }
    })

    if (existing) {
      return this.client.userToken.update({
        where: {id: existing.id},
        data: {encryptedToken}
      })
    } else {
      return this.client.userToken.create({
        data: {userId, service, encryptedToken}
      })
    }
  }

  async delete(id: string) {
    return this.client.userToken.delete({where: {id}});
  }
}
