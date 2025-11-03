import { PrismaClient } from '../generated/prisma';
import { ChatMessageRepository } from './ChatMessageRepository';
import { EntityTagRepository } from './EntityTagRepository';
import { LanguageRepository } from './LanguageRepository';
import { SentenceHistoryRepository } from './SentenceHistoryRepository';
import { TagRepository } from './TagRepository';
import { UserAnswerRepository } from './UserAnswerRepository';
import { UserRepository } from './UserRepository';
import { UserSettingsRepository } from './UserSettingsRepository';
import { UserTokenRepository } from './UserTokenRepository';
import { WordRepository } from './WordRepository';

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
export const userAnswerRepository = new UserAnswerRepository(prisma);
export const chatMessageRepository = new ChatMessageRepository(prisma);
// Export Prisma client instance for direct access if needed
export { prisma };

