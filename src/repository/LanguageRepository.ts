import { PrismaClient } from '../generated/prisma';

export class LanguageRepository {
  private client: PrismaClient['language'];

  constructor(client: PrismaClient) {
    this.client = client.language;
  }

  async create(data: { code: string; name: string; nativeName: string }) {
    return this.client.create({ data });
  }

  async getAll() {
    return this.client.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async findByCode(code: string) {
    return this.client.findUnique({
      where: { code }
    });
  }

  async findById(id: string) {
    return this.client.findUnique({
      where: { id }
    });
  }

  async seedInitialLanguages() {
    const existingLanguages = await this.getAll();
    if (existingLanguages.length > 0) {
      return existingLanguages;
    }

    const languages = [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'pl', name: 'Polish', nativeName: 'Polski' }
    ];

    await this.client.createMany({ data: languages });
    return this.getAll();
  }
}
