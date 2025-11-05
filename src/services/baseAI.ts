import { TokenResult, TokenService } from 'src/utils/tokenService';

export interface AIResponse {
  text: string;
  error?: string;
}

export interface ParsedWord {
  word: string;
  translate: string;
}

/**
 * Base interface for AI services
 */
export interface IAIService {
  serviceName: string;
  parseWordsFromText?(text: string, userId: string): Promise<ParsedWord[]>;
  generateText?(prompt: string, userId: string): Promise<AIResponse>;
  generateTextStream?(prompt: string, userId: string): Promise<AsyncIterable<string>>;
}

/**
 * Base AI service class with common functionality
 */
export abstract class BaseAIService implements IAIService {
  abstract serviceName: string;

  /**
   * Get token for this service for a specific user
   * @param userId - User ID from middleware
   * @returns Promise with token result
   */
  protected async getToken(userId: string): Promise<TokenResult> {
    return await TokenService.getToken(userId, this.serviceName);
  }

  /**
   * Validate that user has token for this service
   * @param userId - User ID from middleware
   * @returns Promise with token or throws error
   */
  protected async validateAndGetToken(userId: string): Promise<string> {
    const tokenResult = await this.getToken(userId);

    if (!tokenResult.token) {
      throw new Error(tokenResult.error || `No token found for ${this.serviceName} service`);
    }

    return tokenResult.token;
  }
}

export default BaseAIService;
