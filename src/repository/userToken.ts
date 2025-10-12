import client from './client';


class UserTokenRepository {
  private client = client.userToken;

  constructor() {
  }

  public async findMany(userId: string) {
    return this.client.findMany({
      where: {userId},
      select: {
        id: true,
        service: true,
        createdAt: true,
        updatedAt: true,
        encryptedToken: true
      }
    });
  }

  public async upsert(userId: string, service: string, encryptedToken: string) {
    return this.client.upsert({
      where: {
        userId_service: {
          userId,
          service
        }
      },
      update: {
        encryptedToken,
        updatedAt: new Date()
      },
      create: {
        service,
        encryptedToken,
        userId
      }
    });
  }

  public async findByUserIdAndService(userId: string, service: string) {
    return this.client.findUnique({
      where: {
        userId_service: {
          userId,
          service
        }
      },
      select: {
        encryptedToken: true
      }
    });
  }

  public async delete(userId: string, service: string) {
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

export const userTokenRepository = new UserTokenRepository();
