import { PrismaClient } from '../generated/prisma';
import { TagRepository } from './TagRepository';
import { WordRepository } from './WordRepository';
import { EntityTagRepository } from './EntityTagRepository';
import { UserRepository } from './UserRepository';
import { UserTokenRepository } from './UserTokenRepository';
import { UserSettingsRepository } from './UserSettingsRepository';
import { SentenceHistoryRepository } from './SentenceHistoryRepository';
import { LanguageRepository } from './LanguageRepository';

// Singleton Prisma client instance
const prisma = new PrismaClient();

// Initialize repository instances
export const tagRepository = new TagRepository(prisma);
export const wordRepository = new WordRepository(prisma);
export const entityTagRepository = new EntityTagRepository(prisma);
export const userRepository = new UserRepository(prisma);
export const userTokenRepository = new UserTokenRepository(prisma);
export const userSettingsRepository = new UserSettingsRepository(prisma);
export const sentenceHistoryRepository = new SentenceHistoryRepository(prisma);
export const languageRepository = new LanguageRepository(prisma);
// Export Prisma client instance for direct access if needed
export { prisma };
