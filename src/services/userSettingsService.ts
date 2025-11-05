import { userSettingsRepository } from 'src/repository/client';

export async function getUserSettingsService(userId: string) {
  const userSettings = await userSettingsRepository.findByUserId(userId);
  if (!userSettings) {
    return {
      theme: 'light',
      aiModel: 'gemini-2.5-flash',
      language: 'en',
      translationLang: 'RU',
      learningLanguage: 'en'
    };
  }
  return userSettings;
}

// TODO: Fix types - create proper UserSettings interface instead of using any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function upsertUserSettingsService(userId: string, body: any) {
  return userSettingsRepository.upsert(userId, body);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateUserSettingsService(userId: string, updateData: any) {
  return userSettingsRepository.update(userId, updateData);
}

export async function deleteUserSettingsService(userId: string) {
  await userSettingsRepository.delete(userId);
  return { message: 'User settings reset to defaults' };
}
