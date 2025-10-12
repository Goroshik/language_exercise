import { GoogleAIService } from './googleAI';
import { OpenAIService } from './openAI';
import { ClaudeAIService } from './claudeAI';
import { IAIService } from './baseAI';

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
      const { userSettingsRepository } = await import('src/repository/userSettings');
      const settings = await userSettingsRepository.findByUserId(userId);
      
      const selectedModel = settings?.aiModel || 'gemini-2.5-flash';
      
      // Determine service based on model name
      if (this.isGeminiModel(selectedModel)) {
        return new GoogleAIService();
      } else if (this.isOpenAIModel(selectedModel)) {
        return new OpenAIService();
      } else if (this.isClaudeModel(selectedModel)) {
        return new ClaudeAIService();
      } else {
        // Default to Gemini if model is not recognized
        console.warn(`Unknown model ${selectedModel}, falling back to Gemini`);
        return new GoogleAIService();
      }
    } catch (error) {
      console.error('Error getting AI service:', error);
      // Default to Gemini on error
      return new GoogleAIService();
    }
  }

  /**
   * Check if model name is a Gemini model
   * @param modelName - Model name to check
   * @returns boolean
   */
  private static isGeminiModel(modelName: string): boolean {
    const geminiModels = [
      'gemini-2.0-flash-exp',
      'gemini-2.5-flash',
      'gemini-1.5-pro',
      'gemini-1.0-pro'
    ];
    return geminiModels.includes(modelName);
  }

  /**
   * Check if model name is an OpenAI model
   * @param modelName - Model name to check
   * @returns boolean
   */
  private static isOpenAIModel(modelName: string): boolean {
    const openaiModels = [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4-turbo-preview',
      'gpt-4',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k'
    ];
    return openaiModels.includes(modelName);
  }

  /**
   * Check if model name is a Claude model
   * @param modelName - Model name to check
   * @returns boolean
   */
  private static isClaudeModel(modelName: string): boolean {
    const claudeModels = [
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ];
    return claudeModels.includes(modelName);
  }

  /**
   * Get all available AI models grouped by provider
   * @returns Object with models grouped by provider
   */
  static getAvailableModels() {
    return {
      gemini: [
        { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Experimental)' },
        { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
        { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
        { value: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro' }
      ],
      openai: [
        { value: 'gpt-4o', label: 'GPT-4o' },
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
      ],
      claude: [
        { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
        { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
        { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
        { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }
      ]
    };
  }
}

export default AIFactory;
