import client from './client';

class UserRepository {
  private client = client.user;

  constructor() {}

  public async getAuth(email: string) {
    return this.client.findUnique({ where: { email } });
  }
}

export default UserRepository;
