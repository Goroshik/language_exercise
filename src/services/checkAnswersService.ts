import Joi from 'joi';

import { GRAMMAR_PROMPTS } from 'src/prompts/grammarPrompts';
import { AIFactory } from 'src/services/aiFactory';
import { formatAIResponse, ServiceResponse } from 'src/services/generateTextService';

interface CheckAnswersRequest {
  topic: string;
  answersText: string;
  languageName?: string;
}

const schema = Joi.object<CheckAnswersRequest>({
  topic: Joi.string().required(),
  answersText: Joi.string().required(),
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

    const { topic, answersText, languageName = 'English' } = value as CheckAnswersRequest;

    const aiService = await AIFactory.getAIService(userId);
    if (!aiService || typeof aiService.generateText !== 'function') {
      return { status: 502, body: { error: 'AI service not available for user' } };
    }

    const prompt = GRAMMAR_PROMPTS.validateAnswers(topic, answersText, languageName);

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
          ? ((rawResult as any).text ?? '')
          : '';

    const result = formatAIResponse(text);

    return { status: 200, body: { success: true, data: result } };
  } catch (err) {
    console.error('Unexpected error in checkAnswers service:', err);
    return { status: 500, body: { error: 'Internal server error' } };
  }
}
