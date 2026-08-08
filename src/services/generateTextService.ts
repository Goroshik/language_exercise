import Joi from 'joi';
import { GRAMMAR_PROMPTS } from 'src/prompts/grammarPrompts';
import {
  languageRepository,
  sentenceHistoryRepository,
  userAnswerRepository,
  wordRepository
} from 'src/repository/client';
import { AIFactory } from 'src/services/aiFactory';
import { DictionaryWord } from 'src/types';

export type Mode = 'student' | 'teacher' | string;

export interface GenerateTextRequest {
  mode: Mode;
  topic: string;
  languageId: string;
  level: string;
  selectedWords?: DictionaryWord[] | undefined;
  customTopic?: string | undefined;
  sentenceCount?: number | undefined;
}

export type ServiceResponse = { status: number; body: unknown };

const BOLD_WORD_PATTERN = /\*\*(.*?)\*\*/g;
const TRAILING_HINTS_PATTERN = /\s*\(([^)]+)\)\s*$/;

interface SentenceContext {
  ownerId: string;
  languageId: string;
  level: string;
  mode: Mode;
  topic: string;
}

/** Lower-cased word -> dictionary word id, skipping entries without a word. */
export function buildWordIdIndex(words: DictionaryWord[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const entry of words) {
    if (entry.word) {
      index.set(entry.word.toLowerCase(), entry.id);
    }
  }
  return index;
}

/** Hints are written as "(hint1, hint2)" at the very end of a sentence. */
export function extractHints(sentence: string): string[] {
  return (
    sentence
      .match(TRAILING_HINTS_PATTERN)?.[1]
      ?.split(/[,;]+/)
      .map(hint => hint.trim())
      .filter(Boolean) ?? []
  );
}

/** Ids of the dictionary words the sentence marked up with **bold**. */
export function collectUsedWordIds(sentence: string, wordIds: Map<string, string>): string[] {
  const used = new Set<string>();
  for (const match of sentence.matchAll(BOLD_WORD_PATTERN)) {
    const wordId = wordIds.get((match[1] ?? '').toLowerCase());
    if (wordId !== undefined) {
      used.add(wordId);
    }
  }
  return Array.from(used);
}

export function buildSentenceRecords(
  sentences: string[],
  wordIds: Map<string, string>,
  context: SentenceContext
) {
  return sentences.map(sentence => ({
    ...context,
    sentence: sentence.replace(TRAILING_HINTS_PATTERN, '').trim(),
    usedWordIds: collectUsedWordIds(sentence, wordIds),
    hints: extractHints(sentence)
  }));
}

const schema = Joi.object({
  mode: Joi.string().required(),
  topic: Joi.string().required(),
  languageId: Joi.string().required(),
  level: Joi.string().required(),
  selectedWords: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().allow(null),
        word: Joi.string().allow('', null)
      })
    )
    .optional(),
  customTopic: Joi.string().allow('', null).optional(),
  sentenceCount: Joi.number().min(1).max(20).optional()
});

export function formatAIResponse(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // Remove numbering from start: "1. ", "2) ", "- ", "* " etc.
      // But preserve ** for markdown bold formatting
      return line.replace(/^(?:[\d]+[).\s]+|[-*]\s+)/, '');
    })
    .map(line => {
      // Simplified approach: Find everything between ** and **
      // First, normalize multiple asterisks (3+) to double asterisks
      line = line.replace(/\*{3,}/g, '**');

      // Check if line already has valid **word** format
      const boldPattern = /\*\*([^*]+)\*\*/g;
      if (boldPattern.test(line)) {
        // Already has valid format, return as is
        return line;
      }

      // Fix simple case: word** -> **word**
      line = line.replace(/([^\s*]+)\*\*/g, '**$1**');

      return line;
    });
}

export async function processGenerateTextRequest(
  rawBody: unknown,
  userId: string
): Promise<ServiceResponse> {
  try {
    const validation = schema.validate(rawBody, { abortEarly: false, stripUnknown: true });
    // TODO: Fix types - properly type Joi validation result instead of using any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error, value } = validation as { error?: any; value: any };
    if (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messages: string[] = (error.details || []).map((d: any) => String(d.message));
      return { status: 400, body: { error: messages.join('; ') } };
    }

    const body = value as GenerateTextRequest;
    const { mode, topic, languageId, level, selectedWords = [], customTopic, sentenceCount } = body;

    // Fetch language by ID
    const language = await languageRepository.findById(languageId);
    if (!language) {
      return { status: 400, body: { error: 'Invalid language ID' } };
    }

    // Auto-select words if user hasn't provided any or provided fewer than 5
    let wordsToUse: DictionaryWord[] = [...selectedWords];
    const targetWordCount = 5;

    if (wordsToUse.length < targetWordCount) {
      try {
        // Get words we need to fill up to 5
        const wordsNeeded = targetWordCount - wordsToUse.length;

        // Get least used words, excluding already selected words
        const selectedWordIds = wordsToUse
          .map(w => w.id)
          .filter((id): id is string => id !== undefined && id !== null);
        const leastUsedWords = await wordRepository.getLeastUsedWords(
          userId,
          language.code,
          wordsNeeded + selectedWordIds.length // Get extra in case some are already selected
        );

        // Filter out already selected words and take only what we need
        const additionalWords = leastUsedWords
          .filter(word => !selectedWordIds.includes(word.id))
          .slice(0, wordsNeeded)
          .map(word => ({
            id: word.id,
            word: word.word,
            translate: word.translate,
            languageCode: word.languageCode,
            createdAt: word.createdAt
          }));

        wordsToUse = [...wordsToUse, ...additionalWords];

        console.log(
          `Auto-selected ${additionalWords.length} words to fill up to ${wordsToUse.length} total words`
        );
      } catch (err) {
        console.error('Failed to auto-select words:', err);
        // Continue with whatever words we have
      }
    }

    const words = wordsToUse.map(w => w.word || '');
    const prompt =
      mode === 'student'
        ? GRAMMAR_PROMPTS.generateStudentExercises({
            topic,
            languageName: language.name,
            selectedWords: words,
            customTopic,
            sentenceCount
          })
        : GRAMMAR_PROMPTS.generateTeacherExamples({
            topic,
            level,
            languageName: language.name,
            selectedWords: words,
            customTopic,
            sentenceCount
          });

    const aiService = await AIFactory.getAIService(userId);
    if (!aiService || typeof aiService.generateText !== 'function') {
      return { status: 502, body: { error: 'AI service not available for user' } };
    }

    let rawResult: unknown;
    try {
      rawResult = await aiService.generateText(prompt, userId);

      console.log('AI Raw Response:', rawResult);
    } catch (err) {
      if (err instanceof Error && err.message.includes('No token found')) {
        return { status: 402, body: { error: 'AI service token not configured for user' } };
      }
      console.error('AI service error (generate text):', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to generate text from AI service';
      return { status: 502, body: { error: errorMessage } };
    }

    const text =
      typeof rawResult === 'string'
        ? rawResult
        : rawResult && typeof rawResult === 'object'
          ? // TODO: Fix types - properly type AI result instead of using any
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((rawResult as any).text ?? '')
          : '';

    console.log('AI Text Before Formatting:', text);
    const result = formatAIResponse(text);
    console.log('AI Text After Formatting:', result);

    // Store sentence IDs to return with sentences
    let sentenceIds: string[] = [];

    if (result.length > 0) {
      try {
        const sentencesToSave = buildSentenceRecords(result, buildWordIdIndex(wordsToUse), {
          ownerId: userId,
          languageId,
          level,
          mode,
          topic
        });

        const sentences = await sentenceHistoryRepository.addHistoryBatch(sentencesToSave);
        sentenceIds = sentences.map(s => s.id);
      } catch (saveErr) {
        console.error('Failed to save generated sentence history:', saveErr);
      }
    }

    // Check which sentences have previous answers
    const hasAnswers: Record<string, boolean> = {};
    if (sentenceIds.length > 0) {
      const answersMap = await userAnswerRepository.checkAnswersExist({
        userId,
        sentenceIds
      });
      Object.assign(hasAnswers, answersMap);
    }

    const responseBody = {
      success: true,
      data: result,
      sentenceIds,
      hasAnswers
    };

    console.log('Final API Response Body:', JSON.stringify(responseBody, null, 2));

    return {
      status: 200,
      body: responseBody
    };
  } catch (err) {
    console.error('Unexpected error in generateText service:', err);
    return { status: 500, body: { error: 'Internal server error' } };
  }
}
