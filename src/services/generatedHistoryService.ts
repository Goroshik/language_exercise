import { sentenceHistoryRepository } from 'src/repository/client';

export async function getGeneratedHistoryService(
  userId: string,
  filters: {
    languageId?: string | undefined;
    level?: string | undefined;
    usedWordIds?: string[] | undefined;
    searchText?: string | undefined;
  }
) {
  return sentenceHistoryRepository.getHistory({
    ownerId: userId,
    ...filters
  });
}
