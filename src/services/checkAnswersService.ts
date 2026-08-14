import Joi from 'joi';

import { GRAMMAR_PROMPTS } from 'src/prompts/grammarPrompts';
import {
  languageRepository,
  wordRepository,
  wordUsageStatsRepository
} from 'src/repository/client';
import { AIFactory } from 'src/services/aiFactory';
import { ServiceResponse } from 'src/services/generateTextService';
import { getUserSettingsService } from 'src/services/userSettingsService';
import { CheckAnswerItem } from 'src/types';
import { extractResponseText, isMissingTokenError } from 'src/utils/aiResponse';

interface ExerciseAnswer {
  id: string;
  sentence: string;
}

interface CheckAnswersRequest {
  topic: string;
  exercises: ExerciseAnswer[];
  languageName?: string;
}

const schema = Joi.object<CheckAnswersRequest>({
  topic: Joi.string().required(),
  exercises: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().required(),
        sentence: Joi.string().allow('').required()
      })
    )
    .required(),
  languageName: Joi.string().optional()
});

/**
 * Pulls the JSON array out of an AI response, which may be wrapped in prose or
 * a markdown fence. Throws when there is nothing array-shaped to parse.
 */
export function parseAiResults(text: string): Array<CheckAnswerItem & { id: string }> {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('No JSON array found in AI response');
  }
  return JSON.parse(jsonMatch[0]);
}

/** Keyed by the exercise id the AI was asked to echo back. */
export function indexResultsById(
  aiResults: Array<CheckAnswerItem & { id: string }>
): Map<string, CheckAnswerItem> {
  const byId = new Map<string, CheckAnswerItem>();
  for (const { id, ...checkResult } of aiResults) {
    byId.set(id, checkResult);
  }
  return byId;
}

/** Words the learner actually wrote, for the dictionary usage counters. */
export function extractUserWords(exercises: ExerciseAnswer[]): string[] {
  return exercises.flatMap(exercise =>
    exercise.sentence
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Mark}\s]/gu, '')
      .split(/\s+/)
      .filter(word => word.length > 1)
  );
}

/**
 * One result per submitted exercise: skipped for blanks, the AI verdict when it
 * came back, and a pass for anything the AI silently dropped.
 */
export function buildFullResults(
  exercises: ExerciseAnswer[],
  resultsById: Map<string, CheckAnswerItem>
): CheckAnswerItem[] {
  return exercises.map(exercise => {
    if (exercise.sentence.trim().length === 0) {
      return { isCorrect: true, skipped: true };
    }
    return resultsById.get(exercise.id) ?? { isCorrect: true };
  });
}

async function resolveLanguageName(userId: string, provided: string | undefined): Promise<string> {
  if (provided) return provided;

  const userSettings = await getUserSettingsService(userId);
  const language = await languageRepository.findByCode(userSettings.learningLanguage || 'en');
  return language?.name || 'English';
}

async function requestValidation(
  userId: string,
  prompt: string
): Promise<{ text: string } | { failure: ServiceResponse }> {
  const aiService = await AIFactory.getAIService(userId);
  if (!aiService || typeof aiService.generateText !== 'function') {
    return { failure: { status: 502, body: { error: 'AI service not available for user' } } };
  }

  try {
    return { text: extractResponseText(await aiService.generateText(prompt, userId)) };
  } catch (err) {
    if (isMissingTokenError(err)) {
      return {
        failure: { status: 402, body: { error: 'AI service token not configured for user' } }
      };
    }
    console.error('AI service error (check answers)', err);
    const error = err instanceof Error ? err.message : 'Failed to validate answers via AI service';
    return { failure: { status: 502, body: { error } } };
  }
}

export async function processCheckAnswersRequest(
  rawBody: unknown,
  userId: string
): Promise<ServiceResponse> {
  try {
    const { error, value } = schema.validate(rawBody, { abortEarly: false, stripUnknown: true });

    if (error) {
      const messages = (error.details || []).map(detail => String(detail.message));
      return { status: 400, body: { error: messages.join('; ') } };
    }

    const { topic, exercises, languageName } = value as CheckAnswersRequest;
    const nonEmptyExercises = exercises.filter(ex => ex.sentence.trim().length > 0);

    if (nonEmptyExercises.length === 0) {
      return { status: 400, body: { error: 'No sentences to check' } };
    }

    const prompt = GRAMMAR_PROMPTS.validateAnswers(
      topic,
      JSON.stringify(nonEmptyExercises, null, 2),
      await resolveLanguageName(userId, languageName)
    );

    const validation = await requestValidation(userId, prompt);
    if ('failure' in validation) return validation.failure;

    let resultsById: Map<string, CheckAnswerItem>;
    try {
      resultsById = indexResultsById(parseAiResults(validation.text));
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('AI response:', validation.text);
      return {
        status: 502,
        body: { error: 'Failed to parse AI validation response. Please try again.' }
      };
    }

    const userWords = extractUserWords(exercises);
    if (userWords.length > 0) {
      trackWordUsage(userId, userWords).catch(trackingErr => {
        console.error('Error tracking word usage:', trackingErr);
      });
    }

    return { status: 200, body: { success: true, data: buildFullResults(exercises, resultsById) } };
  } catch (err) {
    console.error('Unexpected error in checkAnswers service:', err);
    return { status: 500, body: { error: 'Internal server error' } };
  }
}

/**
 * Tracks word usage in the background.
 * Matches words from the user's sentences against the dictionary and increments counters.
 */
async function trackWordUsage(userId: string, userWords: string[]): Promise<void> {
  const userSettings = await getUserSettingsService(userId);
  const learningLanguageCode = userSettings.learningLanguage || 'en';

  const dictionaryWords = await wordRepository.getAllWords(userId, learningLanguageCode);

  const wordMap = new Map<string, string>();
  dictionaryWords.forEach(word => {
    if (word) wordMap.set(word.word.toLowerCase(), word.id);
  });

  const matchedWordIds = new Set<string>();
  userWords.forEach(userWord => {
    const wordId = wordMap.get(userWord.toLowerCase());
    if (wordId) {
      matchedWordIds.add(wordId);
    }
  });

  if (matchedWordIds.size > 0) {
    await wordUsageStatsRepository.incrementUsageForWords(userId, Array.from(matchedWordIds));
  }
}
