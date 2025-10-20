import { sentenceHistoryRepository } from 'src/repository/client';

export async function getGeneratedHistoryService(
  userId: string,
  filters: {
    language?: string;
    level?: string;
    usedWordIds?: string[];
    searchText?: string;
  }
) {
  return sentenceHistoryRepository.getHistory({
    ownerId: userId,
    ...filters
  });
}
