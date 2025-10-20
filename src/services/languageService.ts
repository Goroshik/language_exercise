import { languageRepository } from 'src/repository/client';

export async function getLanguagesService() {
  // Seed initial languages if none exist
  return languageRepository.seedInitialLanguages();
}

export async function getLanguageByCodeService(code: string) {
  return languageRepository.findByCode(code);
}
