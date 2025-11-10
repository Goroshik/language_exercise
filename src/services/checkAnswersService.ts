import Joi from 'joi';

import { GRAMMAR_PROMPTS } from 'src/prompts/grammarPrompts';
import { languageRepository, wordRepository, wordUsageStatsRepository } from 'src/repository/client';
import { AIFactory } from 'src/services/aiFactory';
import { formatAIResponse, ServiceResponse } from 'src/services/generateTextService';
import { getUserSettingsService } from 'src/services/userSettingsService';
import { CheckAnswerItem } from 'src/types';

interface CheckAnswersRequest {
  topic: string;
  sentences: string[];
  languageName?: string;
}

const schema = Joi.object<CheckAnswersRequest>({
  topic: Joi.string().required(),
  sentences: Joi.array().items(Joi.string().allow('')).required(),
  languageName: Joi.string().optional()
});

export async function processCheckAnswersRequest(
  rawBody: unknown,
  userId: string
): Promise<ServiceResponse> {
  try {
    const { error, value } = schema.validate(rawBody, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const messages = (error.details || []).map(detail => String(detail.message));
      return { status: 400, body: { error: messages.join('; ') } };
    }

    const { topic, sentences } = value as CheckAnswersRequest;
    let { languageName } = value as CheckAnswersRequest;

    // Получаем название языка из настроек пользователя, если не передано
    if (!languageName) {
      const userSettings = await getUserSettingsService(userId);
      const learningLanguageCode = userSettings.learningLanguage || 'en';
      const language = await languageRepository.findByCode(learningLanguageCode);
      languageName = language?.name || 'English';
    }

    const aiService = await AIFactory.getAIService(userId);
    if (!aiService || typeof aiService.generateText !== 'function') {
      return { status: 502, body: { error: 'AI service not available for user' } };
    }

    // Создаём карту индексов для непустых предложений
    const sentenceIndexMap: number[] = [];
    const nonEmptySentences = sentences.filter((sentence, index) => {
      const isNonEmpty = sentence.trim().length > 0;
      if (isNonEmpty) {
        sentenceIndexMap.push(index);
      }
      return isNonEmpty;
    });

    // Если нет ни одного предложения для проверки
    if (nonEmptySentences.length === 0) {
      return { status: 400, body: { error: 'No sentences to check' } };
    }

    // Формируем текст с нумерованными предложениями для промпта
    const numberedSentences = nonEmptySentences
      .map((sentence, index) => `${index + 1}. ${sentence}`)
      .join('\n');

    const prompt = GRAMMAR_PROMPTS.validateAnswers(topic, numberedSentences, languageName);

    let rawResult: unknown;
    try {
      rawResult = await aiService.generateText(prompt, userId);
    } catch (err) {
      if (err instanceof Error && err.message.includes('No token found')) {
        return { status: 402, body: { error: 'AI service token not configured for user' } };
      }
      console.error('AI service error (check answers)', err);
      return { status: 502, body: { error: 'Failed to validate answers via AI service' } };
    }

    const text =
      typeof rawResult === 'string'
        ? rawResult
        : rawResult && typeof rawResult === 'object'
          ? ((rawResult as { text?: string }).text ?? '')
          : '';

    const aiResults = formatAIResponse(text);

    // Extract all words in base forms from AI responses for usage tracking
    const allBaseWords: string[] = [];
    aiResults.forEach(line => {
      // Extract words from "WORDS: word1, word2, word3" section
      if (line.includes('WORDS:')) {
        const wordsSection = line.split('WORDS:')[1] || '';
        // Remove any trailing text after the words list
        const wordsPart = wordsSection.split('|')[0];
        const words = wordsPart
          .split(',')
          .map(w => w.trim().toLowerCase())
          .filter(Boolean);
        allBaseWords.push(...words);
      }
    });

    // Match base words with user's dictionary and increment usage counters
    if (allBaseWords.length > 0) {
      try {
        // Get user settings to determine the learning language
        const userSettings = await getUserSettingsService(userId);
        const learningLanguageCode = userSettings.learningLanguage || 'en';

        // Get all user's words in the learning language
        const userWords = await wordRepository.getAllWords(userId, learningLanguageCode);
        
        // Create a map of base word -> word ID
        const wordMap = new Map<string, string>();
        userWords.forEach(word => {
          // Store both the original word and its lowercase version for matching
          wordMap.set(word.word.toLowerCase(), word.id);
        });

        // Find matching word IDs
        const matchedWordIds = new Set<string>();
        allBaseWords.forEach(baseWord => {
          const wordId = wordMap.get(baseWord);
          if (wordId) {
            matchedWordIds.add(wordId);
          }
        });

        // Increment usage counters for matched words
        if (matchedWordIds.size > 0) {
          await wordUsageStatsRepository.incrementUsageForWords(
            userId,
            Array.from(matchedWordIds)
          );
        }
      } catch (trackingErr) {
        // Log error but don't fail the request
        console.error('Error tracking word usage:', trackingErr);
      }
    }

    // Вспомогательный парсер строки ответа AI в структурированный формат
    const parseLineToItem = (line: string): CheckAnswerItem => {
      const lower = line.toLowerCase();
      if (lower.includes('correct')) {
        return { isCorrect: true };
      }

      const item: CheckAnswerItem = { isCorrect: false };

      // Грамматическая ошибка
      if (line.includes('ERROR:')) {
        const beforePipe = line.split('|')[0];
        const grammar = beforePipe
          .replace(/^\d+\.?\s*/, '')
          .replace(/^ERROR:\s*/i, '')
          .trim();
        if (grammar) item.grammarError = grammar;
      }

      // Ошибки перевода
      if (line.includes('TRANSLATION_ERRORS:')) {
        const after = line.split('TRANSLATION_ERRORS:')[1] || '';
        // Extract text before WORDS: if present
        const beforeWords = after.split('WORDS:')[0] || after;
        const list = beforeWords
          .split('|')[0]
          .split(/[,\n]/)
          .map(s => s.trim())
          .filter(Boolean);
        if (list.length) item.translationErrors = list;
      }

      return item;
    };

    // Создаём полный массив результатов с сохранением индексов (структурированный)
    const fullResults: CheckAnswerItem[] = sentences.map((sentence, index) => {
      if (sentence.trim().length === 0) {
        return { isCorrect: true, skipped: true };
      }
      const aiIndex = sentenceIndexMap.indexOf(index);
      const line = aiIndex >= 0 ? aiResults[aiIndex] : '';
      return line ? parseLineToItem(line) : { isCorrect: true };
    });

    return { status: 200, body: { success: true, data: fullResults } };
  } catch (err) {
    console.error('Unexpected error in checkAnswers service:', err);
    return { status: 500, body: { error: 'Internal server error' } };
  }
}
