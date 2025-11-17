import Anthropic from '@anthropic-ai/sdk';
import { userSettingsRepository } from 'src/repository/client';
import { AIResponse, BaseAIService, ParsedWord } from './baseAI';

export class ClaudeAIService extends BaseAIService {
  serviceName = 'anthropic';

  /**
   * Parse text and extract English words with Russian translations
   * @param text - The input text to parse
   * @param userId - User ID from middleware
   * @returns Promise with parsed words array
   */
  async parseWordsFromText(text: string, userId: string): Promise<ParsedWord[]> {
    const token = await this.validateAndGetToken(userId);
    const anthropic = new Anthropic({ apiKey: token });

    // Get user's selected model from settings, default to claude-3-haiku-20240307 for parsing
    const model = (await this.getUserModel(userId)) || 'claude-3-haiku-20240307';

    // Using Claude model ${model} for parsing words`);

    const prompt = `Parse the following text and extract English words or phrases with their Russian translations. 
Return ONLY a valid JSON array with format: [{"word": "english_word", "translate": "russian_translation"}].
Do not include any other text, explanations, or formatting.
If a line contains both English and Russian, extract them as word-translation pairs.
If a line has only English, leave translate empty.
Skip empty lines and non-word content.

Text to parse:
${text}`;

    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 4000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const responseText = response.content[0]?.type === 'text' ? response.content[0].text : '';
    // Claude response:, responseText);

    // Clean response and extract JSON
    const cleanedResponse = responseText.replace(/```json|```/g, '').trim();

    try {
      const parsedWords = JSON.parse(cleanedResponse);
      if (Array.isArray(parsedWords)) {
        return parsedWords.filter(item => item.word && typeof item.word === 'string');
      }
      throw new Error('Invalid response format from Claude');
    } catch (_parseError) {
      throw new Error('Failed to parse Claude response as JSON');
    }
  }

  /**
   * Generate text using Claude model
   * @param prompt - The input prompt for AI generation
   * @param userId - User ID from middleware
   * @returns Promise with generated text or error
   */
  async generateText(prompt: string, userId: string): Promise<AIResponse> {
    const token = await this.validateAndGetToken(userId);
    const anthropic = new Anthropic({ apiKey: token });

    // Get user's selected model from settings
    const model = (await this.getUserModel(userId)) || 'claude-3-5-sonnet-20241022';

    // Using Claude model ${model} for text generation`);

    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';

    return { text };
  }

  /**
   * Generate text with streaming response
   * @param prompt - The input prompt for AI generation
   * @param userId - User ID from middleware
   * @returns Promise with generated text chunks
   */
  async generateTextStream(prompt: string, userId: string): Promise<AsyncIterable<string>> {
    const token = await this.validateAndGetToken(userId);
    const anthropic = new Anthropic({ apiKey: token });

    // Get user's selected model from settings
    const model = (await this.getUserModel(userId)) || 'claude-3-5-sonnet-20241022';

    // Using Claude model ${model} for streaming text generation`);

    const stream = await anthropic.messages.create({
      model: model,
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: true
    });

    async function* textGenerator() {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          yield chunk.delta.text;
        }
      }
    }

    return textGenerator();
  }

  /**
   * Get user's selected AI model from settings
   * @param userId - User ID
   * @returns Promise with model name or null
   */
  private async getUserModel(userId: string): Promise<string | null> {
    try {
      const settings = await userSettingsRepository.findByUserId(userId);

      // Only return the model if it's a Claude model
      if (settings?.aiModel && this.isClaudeModel(settings.aiModel)) {
        return settings.aiModel;
      }

      return null;
    } catch (_error) {
      // On error, return null to use default model
      return null;
    }
  }

  /**
   * Check if model name is a Claude model
   * @param modelName - Model name to check
   * @returns boolean
   */
  private isClaudeModel(modelName: string): boolean {
    const claudeModels = [
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ];
    return claudeModels.includes(modelName);
  }
}

export default ClaudeAIService;
