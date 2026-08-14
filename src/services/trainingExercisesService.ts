import Joi from 'joi';
import { sentenceHistoryRepository, userAnswerRepository } from 'src/repository/client';

export interface TrainingExercisesRequest {
  topic: string;
  languageId: string;
  level: string;
  limit?: number;
  currentSentenceIds?: string[]; // IDs of sentences already displayed on the page
}

export type ServiceResponse = { status: number; body: unknown };

const exercisesSchema = Joi.object({
  topic: Joi.string().required(),
  languageId: Joi.string().required(),
  level: Joi.string().required(),
  limit: Joi.number().integer().min(1).max(20).optional().default(5),
  currentSentenceIds: Joi.array().items(Joi.string()).optional().default([])
});

const availabilitySchema = Joi.object({
  topic: Joi.string().required(),
  languageId: Joi.string().required(),
  level: Joi.string().required(),
  currentSentenceIds: Joi.array().items(Joi.string()).optional().default([])
});

/**
 * Re-attaches hints to a stored sentence in the "(hint1, hint2)" form the
 * exercise parser expects. Sentences without hints are returned unchanged.
 */
export function formatSentenceWithHints(sentence: string, hints: string[] | null): string {
  return hints && hints.length > 0 ? `${sentence} (${hints.join(', ')})` : sentence;
}

export async function getTrainingExercisesService(
  rawBody: unknown,
  userId: string
): Promise<ServiceResponse> {
  try {
    const { error, value } = exercisesSchema.validate(rawBody, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) {
      const messages = (error.details || []).map(detail => String(detail.message));
      return { status: 400, body: { error: messages.join('; ') } };
    }

    const body = value as TrainingExercisesRequest;
    const { topic, languageId, level, limit = 5, currentSentenceIds = [] } = body;

    // Fetch random sentences from history, excluding sentences already on the page
    const sentences = await sentenceHistoryRepository.getRandomSentencesByTopicAndLevel({
      ownerId: userId,
      topic,
      languageId,
      level,
      limit,
      excludeSentenceIds: currentSentenceIds
    });

    if (sentences.length === 0) {
      return {
        status: 404,
        body: { error: 'No exercises found in history for this topic and level' }
      };
    }

    // Check which sentences have previous answers
    const sentenceIds = sentences.map(s => s.id);
    const hasAnswers = await userAnswerRepository.checkAnswersExist({
      userId,
      sentenceIds
    });

    const data = sentences.map(s => formatSentenceWithHints(s.sentence, s.hints));

    return { status: 200, body: { success: true, data, sentenceIds, hasAnswers } };
  } catch (err) {
    console.error('Error in getTrainingExercisesService:', err);
    return { status: 500, body: { error: 'Internal server error' } };
  }
}

export async function checkHistoryAvailabilityService(
  rawBody: unknown,
  userId: string
): Promise<ServiceResponse> {
  try {
    const { error, value } = availabilitySchema.validate(rawBody, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) {
      const messages = (error.details || []).map(detail => String(detail.message));
      return { status: 400, body: { error: messages.join('; ') } };
    }

    const { topic, languageId, level, currentSentenceIds = [] } = value as TrainingExercisesRequest;

    // Count available sentences, excluding already displayed ones
    const count = await sentenceHistoryRepository.countSentencesByTopicAndLevel({
      ownerId: userId,
      topic,
      languageId,
      level,
      excludeSentenceIds: currentSentenceIds
    });

    return {
      status: 200,
      body: {
        success: true,
        available: count > 0,
        count
      }
    };
  } catch (err) {
    console.error('Error in checkHistoryAvailabilityService:', err);
    return { status: 500, body: { error: 'Internal server error' } };
  }
}
