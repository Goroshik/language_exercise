import { generatedSentenceHistoryRepository } from 'src/repository/client';

export async function getGeneratedHistoryService(
  userId: string,
  filters: {
    language?: string;
    level?: string;
    usedWordIds?: string[];
    searchText?: string;
  }
) {
  return generatedSentenceHistoryRepository.getHistory({
    ownerId: userId,
    ...filters,
  });
}
