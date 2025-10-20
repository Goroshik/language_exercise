import { DictionaryWord } from 'src/types';

interface GenerateTextRequest {
  mode?: 'learn' | 'train';
  topic?: string;
  language?: string;
  level?: string;
  selectedWords?: DictionaryWord[];
  prompt?: string;
}

interface AddWordRequest {
  word: string;
  translate: string;
}

interface Tag {
  id: string;
  name: string;
}

type ApiResponse<T> = {
  success: true;
  data: T;
};

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

  private static async post<T>(endpoint: string, data: any): Promise<T> {
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
