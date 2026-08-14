import Joi from 'joi';
import { ESSAY_PROMPTS } from 'src/prompts/essayPrompts';
import { essayRepository, languageRepository } from 'src/repository/client';
import { AIFactory } from 'src/services/aiFactory';
import { extractResponseText, isMissingTokenError } from 'src/utils/aiResponse';
import { NextResponseError } from 'src/utils/NextResponseError';

export interface CheckEssayRequest {
  essayId: string;
  content: string;
  languageCode: string;
}

export interface EssayError {
  text: string;
  explanation: string;
  color: string;
  type: 'grammar' | 'punctuation' | 'style' | 'vocabulary';
}

export interface EssayCheckResponse {
  level: string;
  errors: EssayError[];
  summary: string;
}

export type ServiceResponse = {
  status: number;
  body: {
    success?: boolean;
    data?: EssayCheckResponse;
    error?: string;
  };
};

const schema = Joi.object({
  essayId: Joi.string().required(),
  content: Joi.string().required().min(10),
  languageCode: Joi.string().required()
});

/** The model often wraps its JSON in a markdown fence; unwrap before parsing. */
export function parseEssayReview(text: string): EssayCheckResponse {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return JSON.parse((jsonMatch?.[1] ?? text).trim());
}

async function requestReview(
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
    const error =
      err instanceof Error ? err.message : 'Failed to generate response from AI service';
    return { failure: { status: 502, body: { error } } };
  }
}

/** Resolves the prompt, or the response explaining why it cannot be built. */
async function buildReviewPrompt(
  body: CheckEssayRequest,
  userId: string
): Promise<{ prompt: string } | { failure: ServiceResponse }> {
  const essay = await essayRepository.findByIdAndUser(body.essayId, userId);
  if (!essay) {
    throw new NextResponseError('Essay not found or access denied', 404);
  }

  const language = await languageRepository.findByCode(body.languageCode);
  if (!language) {
    return { failure: { status: 400, body: { error: 'Invalid language code' } } };
  }

  return { prompt: ESSAY_PROMPTS.checkEssay(body.content, language.name) };
}

export async function checkEssayService(
  rawBody: unknown,
  userId: string
): Promise<ServiceResponse> {
  try {
    const { error, value } = schema.validate(rawBody, { abortEarly: false, stripUnknown: true });

    if (error) {
      const messages = (error.details || []).map(detail => String(detail.message));
      return { status: 400, body: { error: messages.join('; ') } };
    }

    const body = value as CheckEssayRequest;
    const built = await buildReviewPrompt(body, userId);
    if ('failure' in built) return built.failure;

    const review = await requestReview(userId, built.prompt);
    if ('failure' in review) return review.failure;

    let aiResponse: EssayCheckResponse;
    try {
      aiResponse = parseEssayReview(review.text);
    } catch (_parseErr) {
      console.error('Failed to parse AI response:', review.text);
      return { status: 500, body: { error: 'Failed to parse AI response. Please try again.' } };
    }

    await essayRepository.update(body.essayId, {
      aiResponse: JSON.stringify(aiResponse),
      level: aiResponse.level
    });

    return { status: 200, body: { success: true, data: aiResponse } };
  } catch (err) {
    if (err instanceof NextResponseError) {
      return { status: err.status, body: { error: err.message } };
    }
    console.error('Unexpected error in checkEssay service:', err);
    return { status: 500, body: { error: 'Internal server error' } };
  }
}
