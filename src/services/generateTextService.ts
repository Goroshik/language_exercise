import Joi from 'joi';
import {GRAMMAR_PROMPTS} from 'src/prompts/grammarPrompts';
import {generatedSentenceHistoryRepository} from 'src/repository/client';
import {AIFactory} from 'src/services/aiFactory';
import {DictionaryWord} from 'src/types';

export type Mode = 'learn' | 'exercise' | string;

export interface GenerateTextRequest {
  mode: Mode;
  topic: string;
  language: string;
  level: string;
  selectedWords?: DictionaryWord[];
}

export type ServiceResponse = { status: number; body: any };

const schema = Joi.object({
  mode: Joi.string().required(),
  topic: Joi.string().required(),
  language: Joi.string().required(),
  level: Joi.string().required(),
  selectedWords: Joi.array().items(Joi.object({
    id: Joi.string().allow(null),
    word: Joi.string().allow('', null),
  })).optional(),
});

function formatAIResponse(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => line.replace(/^[\d\)\.\-\*\s]+/, ''));
}

export async function processGenerateTextRequest(rawBody: unknown, userId: string): Promise<ServiceResponse> {
  try {
    const validation = schema.validate(rawBody, {abortEarly: false, stripUnknown: true});
    const {error, value} = validation as { error?: any; value: any };
    if (error) {
      const messages: string[] = (error.details || []).map((d: any) => String(d.message));
      return {status: 400, body: {error: messages.join('; ')}};
    }

    const body = value as GenerateTextRequest;
    const {mode, topic, language, level, selectedWords = []} = body;

    const words = selectedWords.map(w => w.word || '');
    const prompt = mode === 'learn'
      ? GRAMMAR_PROMPTS.generateTeacherSentences(topic, level, words)
      : GRAMMAR_PROMPTS.generateExercises(topic, words);

    const aiService = await AIFactory.getAIService(userId);
    if (!aiService || typeof aiService.generateText !== 'function') {
      return {status: 502, body: {error: 'AI service not available for user'}};
    }

    let rawResult: unknown;
    try {
      rawResult = await aiService.generateText(prompt, userId);
    } catch (err) {
      if (err instanceof Error && err.message.includes('No token found')) {
        return {status: 402, body: {error: 'AI service token not configured for user'}};
      }
      console.error('AI service error', err);
      return {status: 502, body: {error: 'Failed to generate text from AI service'}};
    }

    const text = typeof rawResult === 'string' ? rawResult : (rawResult && typeof rawResult === 'object' ? (rawResult as any).text ?? '' : '');
    const result = formatAIResponse(text);

    if (result.length > 0) {
      try {
        // Создаем массив словарей для быстрого поиска
        const wordMap = new Map(selectedWords.map(w => [w.word?.toLowerCase(), w.id]));

        // Создаем записи для каждого предложения
        const sentencesToSave = result.map(sentence => {
          // Извлекаем слова в формате **word** из предложения
          const wordsInSentence = new Set<string>();
          const regex = /\*\*(.*?)\*\*/g;
          let match;

          while ((match = regex.exec(sentence)) !== null) {
            const word = match[1].toLowerCase();
            if (wordMap.has(word)) {
              wordsInSentence.add(wordMap.get(word)!);
            }
          }

          // Возвращаем запись даже если нет найденных слов (с пустым массивом)
          return {
            ownerId: userId,
            sentence,
            language,
            usedWordIds: Array.from(wordsInSentence),
            level,
          };
        });

        if (sentencesToSave.length > 0) {
          await generatedSentenceHistoryRepository.addHistoryBatch(sentencesToSave);
        }
      } catch (saveErr) {
        console.warn('Failed to save generated sentence history', saveErr);
      }
    }

    console.log(result)

    return {status: 200, body: {success: true, data: result}};
  } catch (err) {
    console.error('Unexpected error in generateText service:', err);
    return {status: 500, body: {error: 'Internal server error'}};
  }
}
