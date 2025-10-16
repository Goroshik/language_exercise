import { NextResponseError } from 'src/utils/NextResponseError';
import { AIFactory } from './aiFactory';

export async function parseWordsFromTextService(text: string, userId: string) {
  if (!text || typeof text !== 'string') {
    throw new NextResponseError('Text parameter is required and must be a string', 400);
  }
  const aiService = await AIFactory.getAIService(userId);
  return aiService.parseWordsFromText!(text, userId);
}
