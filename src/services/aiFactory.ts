import { userSettingsRepository } from 'src/repository/client';
import { IAIService } from './baseAI';
import { ClaudeAIService } from './claudeAI';
import { GoogleAIService } from './googleAI';
import { OpenAIService } from './openAI';

/**
 * AI Factory for dynamically selecting AI service based on user settings
 */
export class AIFactory {
  /**
   * Get appropriate AI service based on user's selected model
   * @param userId - User ID from middleware
   * @returns Promise with AI service instance
   */
  static async getAIService(userId: string): Promise<IAIService> {
    try {
      const settings = await userSettingsRepository.findByUserId(userId);

      const selectedModel = settings?.aiModel || 'gemini-2.5-flash';

      console.log(selectedModel)

      // Determine service based on model name
      if (this.getAvailableModels().gemini.some(model => model.value === selectedModel)) {
        return new GoogleAIService();
      } else if (this.getAvailableModels().openai.some(model => model.value === selectedModel)) {
        return new OpenAIService();
      } else if (this.getAvailableModels().claude.some(model => model.value === selectedModel)) {
        return new ClaudeAIService();
      } else {
        // Default to Gemini if model is not recognized
        return new GoogleAIService();
      }
    } catch (_error) {
      // Default to Gemini on error
      return new GoogleAIService();
    }
  }

  /**
   * Get all available AI models grouped by provider
   * @returns Object with models grouped by provider
   */
  static getAvailableModels() {
    return {
      gemini: [
        { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'gemini' },
        { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'gemini' },
        { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash-Lite', provider: 'gemini' },
        { value: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro', provider: 'gemini' },
      ],
      openai: [
        { value: 'gpt-5', label: 'GPT-5', provider: 'openai' },
        { value: 'gpt-4.1', label: 'GPT-4.1', provider: 'openai' },
      ],
      claude: [
        { value: 'claude-haiku-4.5', label: 'Claude Haiku 4.5', provider: 'anthropic' },
        { value: 'claude-opus-4.5', label: 'Claude Opus 4.5', provider: 'anthropic' },
        { value: 'claude-sonnet-4.5', label: 'Claude Sonnet 4.5', provider: 'anthropic' },
        { value: 'claude-sonnet-3.5', label: 'Claude Sonnet 3.7', provider: 'anthropic' },
      ]
    };
  }
}

export default AIFactory;
