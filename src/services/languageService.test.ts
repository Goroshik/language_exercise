import { beforeEach, describe, expect, it, vi } from 'vitest';

const seedInitialLanguages = vi.fn();
const findByCode = vi.fn();

vi.mock('src/repository/client', () => ({
  languageRepository: {
    seedInitialLanguages: (...a: unknown[]) => seedInitialLanguages(...a),
    findByCode: (...a: unknown[]) => findByCode(...a)
  }
}));

const { getLanguageByCodeService, getLanguagesService } = await import('./languageService');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getLanguagesService', () => {
  it('returns whatever the repository seeded', async () => {
    seedInitialLanguages.mockResolvedValue([{ code: 'pl' }]);
    await expect(getLanguagesService()).resolves.toEqual([{ code: 'pl' }]);
  });

  it('seeds on every call, since seeding is idempotent', async () => {
    seedInitialLanguages.mockResolvedValue([]);
    await getLanguagesService();
    await getLanguagesService();
    expect(seedInitialLanguages).toHaveBeenCalledTimes(2);
  });

  it('propagates a repository failure', async () => {
    seedInitialLanguages.mockRejectedValue(new Error('db down'));
    await expect(getLanguagesService()).rejects.toThrow('db down');
  });
});

describe('getLanguageByCodeService', () => {
  it('looks the language up by its code', async () => {
    findByCode.mockResolvedValue({ code: 'pl', name: 'Polish' });
    await expect(getLanguageByCodeService('pl')).resolves.toEqual({ code: 'pl', name: 'Polish' });
    expect(findByCode).toHaveBeenCalledWith('pl');
  });

  it('returns null for an unknown code', async () => {
    findByCode.mockResolvedValue(null);
    await expect(getLanguageByCodeService('xx')).resolves.toBeNull();
  });
});
