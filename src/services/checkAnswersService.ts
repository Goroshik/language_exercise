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

    const { topic, exercises } = value as CheckAnswersRequest;
    let { languageName } = value as CheckAnswersRequest;

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

    const nonEmptyExercises = exercises.filter(ex => ex.sentence.trim().length > 0);

    if (nonEmptyExercises.length === 0) {
      return { status: 400, body: { error: 'No sentences to check' } };
    }

    const exercisesJson = JSON.stringify(nonEmptyExercises, null, 2);

    const prompt = GRAMMAR_PROMPTS.validateAnswers(topic, exercisesJson, languageName);

    let rawResult: unknown;
    try {
      rawResult = await aiService.generateText(prompt, userId);
    } catch (err) {
      if (err instanceof Error && err.message.includes('No token found')) {
        return { status: 402, body: { error: 'AI service token not configured for user' } };
      }
      console.error('AI service error (check answers)', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to validate answers via AI service';
      return { status: 502, body: { error: errorMessage } };
    }

    const text =
      typeof rawResult === 'string'
        ? rawResult
        : rawResult && typeof rawResult === 'object'
          ? ((rawResult as { text?: string }).text ?? '')
          : '';

    let aiResults: Array<CheckAnswerItem & { id: string }>;
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in AI response');
      }
      aiResults = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('AI response:', text);
      return {
        status: 502,
        body: { error: 'Failed to parse AI validation response. Please try again.' }
      };
    }

    const resultsById = new Map<string, CheckAnswerItem>();
    aiResults.forEach(result => {
      const { id, ...checkResult } = result;
      resultsById.set(id, checkResult);
    });

    const allUserWords: string[] = [];
    exercises.forEach(exercise => {
      if (exercise.sentence.trim()) {
        const words = exercise.sentence
          .toLowerCase()
          .replace(/[^\p{Letter}\p{Mark}\s]/gu, '')
          .split(/\s+/)
          .filter(word => word.length > 1);
        allUserWords.push(...words);
      }
    });

    if (allUserWords.length > 0) {
      trackWordUsage(userId, allUserWords).catch(trackingErr => {
        console.error('Error tracking word usage:', trackingErr);
      });
    }

    const fullResults: CheckAnswerItem[] = exercises.map(exercise => {
      if (exercise.sentence.trim().length === 0) {
        return { isCorrect: true, skipped: true };
      }
      const result = resultsById.get(exercise.id);
      if (result) {
        return result;
      }
      return { isCorrect: true };
    });

    return { status: 200, body: { success: true, data: fullResults } };
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
