import { DictionaryWord } from 'src/types';

interface GenerateTextRequest {
  mode?: 'student' | 'teacher';
  topic?: string;
  languageId?: string;
  level?: string;
  selectedWords?: DictionaryWord[];
  prompt?: string;
}

interface AddWordRequest {
  word: string;
  translate: string;
}

interface CheckAnswersRequest {
  topic: string;
  sentences: string[];
  languageName?: string;
}

interface Tag {
  id: string;
  name: string;
}

export class ApiService {
  static async generateText(data: GenerateTextRequest): Promise<string[]> {
    return this.post<string[]>('/api/ai/generate-text', data);
  }

  static async getTags(): Promise<Tag[]> {
    return this.get<Tag[]>('/api/dictionary/tags');
  }

  static async addWord(data: AddWordRequest): Promise<void> {
    return this.post<void>('/api/dictionary/words', data);
  }

  static async checkAnswers(data: CheckAnswersRequest): Promise<string[]> {
    return this.post<string[]>('/api/ai/check-answers', data);
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

    return response.json().then(({ data }) => data);
  }

  private static async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(endpoint);

    return await response.json().then(({ data }) => data);
  }
}
