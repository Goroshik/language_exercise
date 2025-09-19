import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google AI with API key from environment
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_TOKEN || '');

// Get Gemini Pro model (gemini-1.5-pro is the more advanced version)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export interface AIResponse {
  text: string;
  error?: string;
}

export interface ParsedWord {
  word: string;
  translate: string;
}

export class GoogleAIService {
  /**
   * Parse text and extract English words with Russian translations
   * @param text - The input text to parse
   * @returns Promise with parsed words array
   */
  static async parseWordsFromText(text: string): Promise<ParsedWord[]> {
    try {
      if (!process.env.REACT_APP_GEMINI_TOKEN) {
        throw new Error('Gemini API token not found in environment variables');
      }

      const prompt = `Parse the following text and extract English words or phrases with their Russian translations. 
Return ONLY a valid JSON array with format: [{"word": "english_word", "translate": "russian_translation"}].
Do not include any other text, explanations, or formatting.
If a line contains both English and Russian, extract them as word-translation pairs.
If a line has only English, leave translate empty.
Skip empty lines and non-word content.

Text to parse:
${text}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      // NOTE: Clean response and extract JSON
      const cleanedResponse = responseText.replace(/```json|```/g, '').trim();

      try {
        const parsedWords = JSON.parse(cleanedResponse);
        if (Array.isArray(parsedWords)) {
          return parsedWords.filter(item => item.word && typeof item.word === 'string');
        }
        return [];
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', cleanedResponse);
        return [];
      }
    } catch (error) {
      console.error('Error parsing words with AI:', error);
      return [];
    }
  }

  /**
   * Generate text using Gemini Lite model
   * @param prompt - The input prompt for AI generation
   * @returns Promise with generated text or error
   */
  static async generateText(prompt: string): Promise<AIResponse> {
    try {
      if (!process.env.REACT_APP_GEMINI_TOKEN) {
        return { text: '', error: 'Gemini API token not found in environment variables' };
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return { text };
    } catch (error) {
      console.error('Google AI API Error:', error);
      return {
        text: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate text with streaming response
   * @param prompt - The input prompt for AI generation
   * @returns Promise with generated text chunks
   */
  static async generateTextStream(prompt: string): Promise<AsyncIterable<string>> {
    if (!process.env.REACT_APP_GEMINI_TOKEN) {
      throw new Error('Gemini API token not found in environment variables');
    }

    const result = await model.generateContentStream(prompt);

    async function* textGenerator() {
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        yield chunkText;
      }
    }

    return textGenerator();
  }
}

export default GoogleAIService;
