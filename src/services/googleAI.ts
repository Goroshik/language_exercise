import {GoogleGenerativeAI} from '@google/generative-ai';
import { BaseAIService, AIResponse, ParsedWord } from './baseAI';

export class GoogleAIService extends BaseAIService {
  serviceName = 'gemini';
  /**
   * Parse text and extract English words with Russian translations
   * @param text - The input text to parse
   * @param userId - User ID from middleware
   * @returns Promise with parsed words array
   */
  async parseWordsFromText(text: string, userId: string): Promise<ParsedWord[]> {
    try {
      const token = await this.validateAndGetToken(userId);
      const genAI = new GoogleGenerativeAI(token);
      const model = genAI.getGenerativeModel({model: 'gemini-2.5-flash'});

      console.log('Using Gemini Lite model for parsing words');

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

      console.log('AI response:', responseText)

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
   * @param userId - User ID from middleware
   * @returns Promise with generated text or error
   */
  async generateText(prompt: string, userId: string): Promise<AIResponse> {
    try {
      const token = await this.validateAndGetToken(userId);
      const genAI = new GoogleGenerativeAI(token);
      const model = genAI.getGenerativeModel({model: 'gemini-2.5-flash'});


      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {text};
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
   * @param userId - User ID from middleware
   * @returns Promise with generated text chunks
   */
  async generateTextStream(prompt: string, userId: string): Promise<AsyncIterable<string>> {
    const token = await this.validateAndGetToken(userId);
    const genAI = new GoogleGenerativeAI(token);
    const model = genAI.getGenerativeModel({model: 'gemini-2.5-flash'});


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
