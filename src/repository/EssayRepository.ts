import { PrismaClient, Essay } from '../generated/prisma';

export class EssayRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new essay
   */
  async create(data: {
    userId: string;
    title: string;
    content: string;
    languageCode: string;
    aiResponse?: string;
    level?: string;
  }): Promise<Essay> {
    return this.prisma.essay.create({
      data
    });
  }

  /**
   * Update an existing essay
   */
  async update(
    id: string,
    data: {
      title?: string;
      content?: string;
      aiResponse?: string;
      level?: string;
    }
  ): Promise<Essay> {
    return this.prisma.essay.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Find essay by ID
   */
  async findById(id: string): Promise<Essay | null> {
    return this.prisma.essay.findUnique({
      where: { id }
    });
  }

  /**
   * Find essay by ID and userId (for security)
   */
  async findByIdAndUser(id: string, userId: string): Promise<Essay | null> {
    return this.prisma.essay.findFirst({
      where: {
        id,
        userId
      }
    });
  }

  /**
   * Get all essays for a user with optional language filter
   */
  async findByUser(
    userId: string,
    languageCode?: string
  ): Promise<Array<{ id: string; title: string; languageCode: string; updatedAt: Date }>> {
    const where = languageCode ? { userId, languageCode } : { userId };
    
    return this.prisma.essay.findMany({
      where,
      select: {
        id: true,
        title: true,
        languageCode: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
  }

  /**
   * Delete an essay
   */
  async delete(id: string, userId: string): Promise<Essay> {
    // First verify the essay exists and belongs to user
    const essay = await this.prisma.essay.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!essay) {
      throw new Error('Essay not found or access denied');
    }

    return this.prisma.essay.delete({
      where: { id }
    });
  }

  /**
   * Check if essay exists
   */
  async exists(id: string, userId: string): Promise<boolean> {
    const count = await this.prisma.essay.count({
      where: {
        id,
        userId
      }
    });
    return count > 0;
  }
}
