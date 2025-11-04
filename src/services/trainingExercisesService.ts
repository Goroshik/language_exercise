import Joi from 'joi';
import { sentenceHistoryRepository } from 'src/repository/client';

export interface TrainingExercisesRequest {
  topic: string;
  languageId: string;
  level: string;
  limit?: number;
}

// TODO: Fix types - properly type ServiceResponse body instead of using any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ServiceResponse = { status: number; body: any };

const schema = Joi.object({
  topic: Joi.string().required(),
  languageId: Joi.string().required(),
  level: Joi.string().required(),
  limit: Joi.number().integer().min(1).max(20).optional().default(5)
});

export async function getTrainingExercisesService(
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

    const body = value as TrainingExercisesRequest;
    const { topic, languageId, level, limit = 5 } = body;

    // Fetch random sentences from history
    const sentences = await sentenceHistoryRepository.getRandomSentencesByTopicAndLevel({
      ownerId: userId,
      topic,
      languageId,
      level,
      limit
    });

    if (sentences.length === 0) {
      return {
        status: 404,
        body: { error: 'No exercises found in history for this topic and level' }
      };
    }

    // Format response similar to generateText service
    const data = sentences.map(s => s.sentence);
    const sentenceIds = sentences.map(s => s.id);

    return { status: 200, body: { success: true, data: { data, sentenceIds } } };
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
    const schema = Joi.object({
      topic: Joi.string().required(),
      languageId: Joi.string().required(),
      level: Joi.string().required()
    });

    const validation = schema.validate(rawBody, { abortEarly: false, stripUnknown: true });
    // TODO: Fix types - properly type Joi validation result instead of using any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error, value } = validation as { error?: any; value: any };
    if (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messages: string[] = (error.details || []).map((d: any) => String(d.message));
      return { status: 400, body: { error: messages.join('; ') } };
    }

    const { topic, languageId, level } = value;

    // Count available sentences
    const count = await sentenceHistoryRepository.countSentencesByTopicAndLevel({
      ownerId: userId,
      topic,
      languageId,
      level
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
