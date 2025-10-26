import { wordRepository } from 'src/repository/client';
import { NextResponseError } from 'src/utils/NextResponseError';
import { AIFactory } from './aiFactory';

interface ParsedWord {
  word: string;
  translate: string;
  isDuplicate?: boolean;
}

export async function parseWordsFromTextService(text: string, userId: string) {
  if (!text || typeof text !== 'string') {
    throw new NextResponseError('Text parameter is required and must be a string', 400);
  }
  const aiService = await AIFactory.getAIService(userId);
  const words = await aiService.parseWordsFromText!(text, userId);

  // Check for duplicates
  if (words && words.length > 0) {
    const existingWords = await wordRepository.findManyByWords(
      userId,
      words.map((w: ParsedWord) => w.word)
    );
    const existingWordsSet = new Set(existingWords.map(w => w.word.toLowerCase()));

    return words.map((word: ParsedWord) => ({
      ...word,
      isDuplicate: existingWordsSet.has(word.word.toLowerCase())
    }));
  }

  return words;
}
