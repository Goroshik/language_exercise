import { Essay, EssayCheckResponse } from 'src/store/essayStore';

export const essayService = {
  /**
   * Get default essay topics for a language
   */
  async getDefaultTopics(languageCode: string): Promise<string[]> {
    const response = await fetch(`/api/essays/default-topics?languageCode=${languageCode}`);
    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    throw new Error('Failed to load default topics');
  },

  /**
   * Get all essays for current user
   */
  async getEssays(languageCode: string): Promise<Essay[]> {
    const response = await fetch(`/api/essays?languageCode=${languageCode}`);
    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    throw new Error('Failed to load essays');
  },

  /**
   * Create a new essay
   */
  async createEssay(title: string, content: string, languageCode: string): Promise<Essay> {
    const response = await fetch('/api/essays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, languageCode })
    });
    const data = await response.json();
    if (data.success && data.data) {
      return data.data;
    }
    throw new Error(data.error || 'Failed to create essay');
  },

  /**
   * Update an existing essay
   */
  async updateEssay(id: string, title: string, content: string): Promise<Essay> {
    const response = await fetch(`/api/essays/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });
    const data = await response.json();
    if (data.success && data.data) {
      return data.data;
    }
    throw new Error(data.error || 'Failed to update essay');
  },

  /**
   * Check essay with AI
   */
  async checkEssay(
    essayId: string,
    content: string,
    languageCode: string
  ): Promise<EssayCheckResponse> {
    const response = await fetch('/api/essays/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ essayId, content, languageCode })
    });
    const data = await response.json();
    if (data.success && data.data) {
      return data.data;
    }
    throw new Error(data.error || 'Failed to check essay');
  }
};
