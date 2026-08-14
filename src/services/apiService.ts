import { CheckAnswerItem, DictionaryWord } from 'src/types';

interface GenerateTextRequest {
  mode?: 'student' | 'teacher' | undefined;
  topic?: string | undefined;
  languageId?: string | undefined;
  level?: string | undefined;
  selectedWords?: DictionaryWord[] | undefined;
  prompt?: string | undefined;
  customTopic?: string | undefined;
  sentenceCount?: number | undefined;
}

interface AddWordRequest {
  word: string;
  translate: string;
}

interface CheckAnswersRequest {
  topic: string;
  exercises: Array<{ id: string; sentence: string }>;
  languageName?: string;
}

interface Tag {
  id: string;
  name: string;
}

export class ApiService {
  static async generateText(
    data: GenerateTextRequest
  ): Promise<{ data: string[]; sentenceIds: string[]; hasAnswers?: Record<string, boolean> }> {
    console.log('ApiService.generateText called with:', data);
    const result = await this.post<{
      data: string[];
      sentenceIds: string[];
      hasAnswers?: Record<string, boolean>;
    }>('/api/ai/generate-text', data);
    console.log('ApiService.generateText result:', result);
    return result;
  }

  static async getTrainingExercises(data: {
    topic: string;
    languageId: string;
    level: string;
    limit?: number;
    currentSentenceIds?: string[];
  }): Promise<{ data: string[]; sentenceIds: string[]; hasAnswers?: Record<string, boolean> }> {
    return this.post<{
      data: string[];
      sentenceIds: string[];
      hasAnswers?: Record<string, boolean>;
    }>('/api/ai/training-exercises', data);
  }

  static async checkHistoryAvailability(data: {
    topic: string;
    languageId: string;
    level: string;
    currentSentenceIds?: string[];
  }): Promise<{ available: boolean; count: number }> {
    return this.post<{ available: boolean; count: number }>(
      '/api/ai/check-history-availability',
      data
    );
  }

  static async getTags(): Promise<Tag[]> {
    return this.get<Tag[]>('/api/dictionary/tags');
  }

  static async addWord(data: AddWordRequest): Promise<void> {
    return this.post<void>('/api/dictionary/words', data);
  }

  static async checkAnswers(data: CheckAnswersRequest): Promise<CheckAnswerItem[]> {
    return this.post<CheckAnswerItem[]>('/api/ai/check-answers', data);
  }

  static async saveUserAnswer(sentenceId: string, answer: string): Promise<void> {
    return this.post<void>('/api/user-answers', { sentenceId, answer });
  }

  static async getUserAnswers(
    sentenceIds: string[]
  ): Promise<Array<{ sentenceId: string; answer: string }>> {
    const queryString = sentenceIds.join(',');
    return this.get<Array<{ sentenceId: string; answer: string }>>(
      `/api/user-answers?sentenceIds=${queryString}`
    );
  }

  private static async post<T>(
    endpoint: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
  ): Promise<T> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const responseData = await response.json();

    // Check if response indicates an error
    if (!response.ok || responseData.error) {
      const errorMessage = responseData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    if (endpoint === '/api/ai/generate-text' || endpoint === '/api/ai/training-exercises') {
      return responseData as T;
    }
    return responseData.data as T;
  }

  private static async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(endpoint);

    const responseData = await response.json();

    // Check if response indicates an error
    if (!response.ok || responseData.error) {
      const errorMessage = responseData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return responseData.data;
  }
}
