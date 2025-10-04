import {PrismaClient, Prisma} from 'src/generated/prisma';
import {DictionaryWord} from 'src/types';

// NOTE: Export TagItem interface for compatibility
export interface TagItem {
  id: string;
  name: string;
  createdAt: Date;
  color?: string;
}

class PrismaService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // NOTE: Initialize connection (for compatibility with IndexedDB interface)
  async init(): Promise<void> {
    // NOTE: Prisma client initializes automatically, but we can test connection
    try {
      await this.prisma.$connect();
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  // NOTE: Word CRUD operations
  async addWord(word: DictionaryWord): Promise<void> {
    const {tags: tagNames, ...wordData} = word;

    await this.prisma.word.create({
      data: {
        ...wordData,
        tags: {
          create: tagNames.map(tagName => ({
            entityType: 'word',
            tag: {
              connectOrCreate: {
                where: {
                  name: tagName
                },
                create: {name: tagName}
              }
            }
          }))
        }
      }
    });
  }

  async updateWord(word: DictionaryWord): Promise<void> {
    const {tags: tagNames, ...wordData} = word;

    // NOTE: First delete existing tag relations, then create new ones
    await this.prisma.entityTag.deleteMany({
      where: {
        entityType: 'word',
        entityId: word.id}
    });

    await this.prisma.word.update({
      where: {id: word.id},
      data: {
        ...wordData,
        tags: {
          create: tagNames.map(tagName => ({
            entityType: 'word',
            entityId: word.id,
            tag: {
              connectOrCreate: {
                where: {name: tagName},
                create: {name: tagName}
              }
            }
          }))
        }
      }
    });
  }

  async deleteWord(id: string): Promise<void> {
    await this.prisma.word.delete({
      where: {id}
    });
  }


  async getAllWords() {
    return this.prisma.word.findMany({
      include: {
        tags: {
          where: {
            entityType: "word"
          },
          include: {
            tag: true
          }
        }
      }
    });
  }

  // NOTE: Tag CRUD operations
  async addTag(tag: TagItem): Promise<void> {
    await this.prisma.tag.create({
      data: tag
    });
  }

  async updateTag(tag: TagItem): Promise<void> {
    await this.prisma.tag.update({
      where: {id: tag.id},
      data: tag
    });
  }

  async deleteTag(id: string): Promise<void> {
    await this.prisma.tag.delete({
      where: {id}
    });
  }

  async getAllTags() {
    return this.prisma.tag.findMany();
  }


  async searchWords(query: string = '', selectedTags: string[] = []) {
    const whereCondition: Prisma.WordWhereInput = {};

    if (query) {
      whereCondition.OR = [
        {word: {contains: query, mode: 'insensitive'}},
        {translate: {contains: query, mode: 'insensitive'}}
      ];
    }

    if (selectedTags.length > 0) {
      whereCondition.tags = {
        some: {
          tag: {
            name: {in: selectedTags}
          }
        }
      };
    }

    return this.prisma.word.findMany({
      where: whereCondition,
      include: {
        tags: {
          where: {
            entityType: "word"
          },
          include: {
            tag: true
          }
        }
      }
    });
  }

  async importWords(words: DictionaryWord[]): Promise<void> {
    for (const word of words) {
      await this.addWord(word);
    }
  }

  // NOTE: Cleanup connection
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export const prismaService = new PrismaService();
