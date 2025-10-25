import Joi from 'joi';

import { GRAMMAR_PROMPTS } from 'src/prompts/grammarPrompts';
import { AIFactory } from 'src/services/aiFactory';
import { formatAIResponse, ServiceResponse } from 'src/services/generateTextService';

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

    const { topic, sentences, languageName = 'English' } = value as CheckAnswersRequest;

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

    // Создаём полный массив результатов с сохранением индексов
    const fullResults = sentences.map((sentence, index) => {
      if (sentence.trim().length === 0) {
        return 'SKIPPED'; // Пустые предложения пропускаем
      }
      const aiIndex = sentenceIndexMap.indexOf(index);
      return aiIndex >= 0 ? aiResults[aiIndex] : 'SKIPPED';
    });

    return { status: 200, body: { success: true, data: fullResults } };
  } catch (err) {
    console.error('Unexpected error in checkAnswers service:', err);
    return { status: 500, body: { error: 'Internal server error' } };
  }
}
