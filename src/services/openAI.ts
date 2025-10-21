import OpenAI from 'openai';
import { BaseAIService, AIResponse, ParsedWord } from './baseAI';
import { userSettingsRepository } from 'src/repository/client';
import { showAlert } from 'src/utils/alert';

export class OpenAIService extends BaseAIService {
  serviceName = 'openai';

  /**
   * Parse text and extract English words with Russian translations
   * @param text - The input text to parse
   * @param userId - User ID from middleware
   * @returns Promise with parsed words array
   */
  async parseWordsFromText(text: string, userId: string): Promise<ParsedWord[]> {
    try {
      const token = await this.validateAndGetToken(userId);
      const openai = new OpenAI({ apiKey: token });

      // Get user's selected model from settings, default to gpt-4o-mini for parsing
      const model = (await this.getUserModel(userId)) || 'gpt-4o-mini';

      // Using OpenAI model ${model} for parsing words`);

      const prompt = `Parse the following text and extract English words or phrases with their Russian translations. 
Return ONLY a valid JSON array with format: [{"word": "english_word", "translate": "russian_translation"}].
Do not include any other text, explanations, or formatting.
If a line contains both English and Russian, extract them as word-translation pairs.
If a line has only English, leave translate empty.
Skip empty lines and non-word content.

Text to parse:
${text}`;

      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that parses text and extracts word-translation pairs. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      });

      const responseText = response.choices[0]?.message?.content || '';
      // OpenAI response:, responseText);

      // Clean response and extract JSON
      const cleanedResponse = responseText.replace(/```json|```/g, '').trim();

      try {
        const parsedWords = JSON.parse(cleanedResponse);
        if (Array.isArray(parsedWords)) {
          return parsedWords.filter(item => item.word && typeof item.word === 'string');
        }
        return [];
      } catch (parseError) {
        showAlert.error('Failed to parse OpenAI response as JSON');
        return [];
      }
    } catch (error) {
      showAlert.error('Error parsing words with OpenAI');
      return [];
    }
  }

  /**
   * Generate text using OpenAI model
   * @param prompt - The input prompt for AI generation
   * @param userId - User ID from middleware
   * @returns Promise with generated text or error
   */
  async generateText(prompt: string, userId: string): Promise<AIResponse> {
    try {
      const token = await this.validateAndGetToken(userId);
      const openai = new OpenAI({ apiKey: token });

      // Get user's selected model from settings
      const model = (await this.getUserModel(userId)) || 'gpt-4o-mini';

      // Using OpenAI model ${model} for text generation`);

      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      });

      const text = response.choices[0]?.message?.content || '';

      return { text };
    } catch (error) {
      showAlert.error('OpenAI API Error');
      return {
        text: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate text with streaming response
   * @param prompt - The input prompt for AI generation
   * @param userId - User ID from middleware
   * @returns Promise with generated text chunks
   */
  async generateTextStream(prompt: string, userId: string): Promise<AsyncIterable<string>> {
    const token = await this.validateAndGetToken(userId);
    const openai = new OpenAI({ apiKey: token });

    // Get user's selected model from settings
    const model = (await this.getUserModel(userId)) || 'gpt-4o-mini';

    // Using OpenAI model ${model} for streaming text generation`);

    const stream = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      stream: true
    });

    async function* textGenerator() {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield content;
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

      // Only return the model if it's an OpenAI model
      if (settings?.aiModel && this.isOpenAIModel(settings.aiModel)) {
        return settings.aiModel;
      }

      return null;
    } catch (error) {
      showAlert.error('Error fetching user model settings');
      return null;
    }
  }

  /**
   * Check if model name is an OpenAI model
   * @param modelName - Model name to check
   * @returns boolean
   */
  private isOpenAIModel(modelName: string): boolean {
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
}

export default OpenAIService;
