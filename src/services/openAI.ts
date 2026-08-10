import OpenAI from 'openai';
import { userSettingsRepository } from 'src/repository/client';
import { AIResponse, BaseAIService, ParsedWord } from './baseAI';

interface OpenAIError {
  status?: number;
  message?: string;
}

const DEFAULT_MODEL = 'gpt-4o-mini';
const RATE_LIMIT_MESSAGE =
  'OpenAI rate limit exceeded. Please check your plan and billing details.';

const OPENAI_MODELS = [
  'gpt-5',
  'gpt-4.1',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-4-turbo-preview',
  'gpt-4',
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-16k'
];

// Module-level rather than private methods: istanbul reports class methods as
// "(anonymous_N)", which leaves crap4ts unable to attribute their coverage.

export function isOpenAIModel(modelName: string): boolean {
  return OPENAI_MODELS.includes(modelName);
}

/** Rate limits get a message the user can act on; anything else passes through. */
export function rethrowOpenAIError(error: unknown): never {
  const openaiError = error as OpenAIError;
  if (openaiError?.status === 429 || openaiError?.message?.includes('429')) {
    throw new Error(RATE_LIMIT_MESSAGE);
  }
  throw error;
}

export function buildParsePrompt(text: string): string {
  return `Parse the following text and extract English words or phrases with their Russian translations.
Return ONLY a valid JSON array with format: [{"word": "english_word", "translate": "russian_translation"}].
Do not include any other text, explanations, or formatting.
If a line contains both English and Russian, extract them as word-translation pairs.
If a line has only English, leave translate empty.
Skip empty lines and non-word content.

Text to parse:
${text}`;
}

/** Strips a markdown fence, parses the array and drops entries with no word. */
export function parseWordPairs(responseText: string): ParsedWord[] {
  const cleaned = responseText.replace(/```json|```/g, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse OpenAI response as JSON');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Invalid response format from OpenAI');
  }

  return (parsed as ParsedWord[]).filter(item => item.word && typeof item.word === 'string');
}

/** Yields only the non-empty content deltas of a chat completion stream. */
export async function* streamContent(
  stream: AsyncIterable<{ choices?: Array<{ delta?: { content?: string | null } }> }>
): AsyncIterable<string> {
  for await (const chunk of stream) {
    const content = chunk.choices?.[0]?.delta?.content || '';
    if (content) {
      yield content;
    }
  }
}

export class OpenAIService extends BaseAIService {
  serviceName = 'openai';

  /**
   * Parse text and extract English words with Russian translations
   * @param text - The input text to parse
   * @param userId - User ID from middleware
   * @returns Promise with parsed words array
   */
  async parseWordsFromText(text: string, userId: string): Promise<ParsedWord[]> {
    const client = await this.client(userId);

    try {
      const response = await client.openai.chat.completions.create({
        model: client.model,
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that parses text and extracts word-translation pairs. Always respond with valid JSON only.'
          },
          { role: 'user', content: buildParsePrompt(text) }
        ],
        temperature: 0.3
      });

      return parseWordPairs(response.choices[0]?.message?.content || '');
    } catch (error: unknown) {
      rethrowOpenAIError(error);
    }
  }

  /**
   * Generate text using OpenAI model
   * @param prompt - The input prompt for AI generation
   * @param userId - User ID from middleware
   * @returns Promise with generated text or error
   */
  async generateText(prompt: string, userId: string): Promise<AIResponse> {
    const client = await this.client(userId);

    try {
      const response = await client.openai.chat.completions.create({
        model: client.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      });

      return { text: response.choices[0]?.message?.content || '' };
    } catch (error: unknown) {
      rethrowOpenAIError(error);
    }
  }

  /**
   * Generate text with streaming response
   * @param prompt - The input prompt for AI generation
   * @param userId - User ID from middleware
   * @returns Promise with generated text chunks
   */
  async generateTextStream(prompt: string, userId: string): Promise<AsyncIterable<string>> {
    const client = await this.client(userId);

    try {
      const stream = await client.openai.chat.completions.create({
        model: client.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        stream: true
      });

      return streamContent(stream);
    } catch (error: unknown) {
      rethrowOpenAIError(error);
    }
  }

  /** Authenticated client plus the model the user picked, or the default. */
  private async client(userId: string): Promise<{ openai: OpenAI; model: string }> {
    const token = await this.validateAndGetToken(userId);
    return {
      openai: new OpenAI({ apiKey: token }),
      model: (await this.getUserModel(userId)) || DEFAULT_MODEL
    };
  }

  /**
   * Get user's selected AI model from settings
   * @param userId - User ID
   * @returns Promise with model name or null
   */
  private async getUserModel(userId: string): Promise<string | null> {
    try {
      const settings = await userSettingsRepository.findByUserId(userId);

      // Only honour the setting when it names an OpenAI model.
      return settings?.aiModel && isOpenAIModel(settings.aiModel) ? settings.aiModel : null;
    } catch (_error) {
      // On error, fall back to the default model.
      return null;
    }
  }
}

export default OpenAIService;
