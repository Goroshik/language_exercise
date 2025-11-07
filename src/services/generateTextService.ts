import Joi from 'joi';
import { GRAMMAR_PROMPTS } from 'src/prompts/grammarPrompts';
import {
  languageRepository,
  sentenceHistoryRepository,
  userAnswerRepository
} from 'src/repository/client';
import { AIFactory } from 'src/services/aiFactory';
import { DictionaryWord } from 'src/types';
import { showAlert } from 'src/utils/alert';

export type Mode = 'student' | 'teacher' | string;

export interface GenerateTextRequest {
  mode: Mode;
  topic: string;
  languageId: string;
  level: string;
  selectedWords?: DictionaryWord[];
  customTopic?: string;
  sentenceCount?: number;
}

// TODO: Fix types - properly type ServiceResponse body instead of using any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ServiceResponse = { status: number; body: any };

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
    .map(line => line.replace(/^[\d).*\s-]+/, ''));
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

    const words = selectedWords.map(w => w.word || '');
    const prompt =
      mode === 'student'
        ? GRAMMAR_PROMPTS.generateStudentExercises(topic, language.name, words, customTopic, sentenceCount)
        : GRAMMAR_PROMPTS.generateTeacherExamples(topic, level, language.name, words, customTopic, sentenceCount);

    const aiService = await AIFactory.getAIService(userId);
    if (!aiService || typeof aiService.generateText !== 'function') {
      return { status: 502, body: { error: 'AI service not available for user' } };
    }

    let rawResult: unknown;
    try {
      rawResult = await aiService.generateText(prompt, userId);
    } catch (err) {
      if (err instanceof Error && err.message.includes('No token found')) {
        return { status: 402, body: { error: 'AI service token not configured for user' } };
      }
      showAlert.error('AI service error');
      return { status: 502, body: { error: 'Failed to generate text from AI service' } };
    }

    const text =
      typeof rawResult === 'string'
        ? rawResult
        : rawResult && typeof rawResult === 'object'
          // TODO: Fix types - properly type AI result instead of using any
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? ((rawResult as any).text ?? '')
          : '';
    const result = formatAIResponse(text);

    // Store sentence IDs to return with sentences
    let sentenceIds: string[] = [];

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
              // TODO: Fix type - use proper null handling instead of non-null assertion
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              wordsInSentence.add(wordMap.get(word)!);
            }
          }

          // Извлекаем подсказки из предложения
          // Формат подсказок: (hint1, hint2) в конце предложения
          const hintMatch = sentence.match(/\s*\(([^)]+)\)\s*$/);
          const hints: string[] = hintMatch
            ? hintMatch[1]
                .split(/[,;]+/)
                .map(h => h.trim())
                .filter(Boolean)
            : [];

          // Удаляем подсказки из предложения перед сохранением
          const sentenceWithoutHints = sentence.replace(/\s*\([^)]+\)\s*$/, '').trim();

          // Возвращаем запись даже если нет найденных слов (с пустым массивом)
          return {
            ownerId: userId,
            sentence: sentenceWithoutHints,
            languageId,
            usedWordIds: Array.from(wordsInSentence),
            level,
            mode, // Сохраняем режим генерации (student/teacher)
            topic, // Сохраняем топик, под которым были сгенерированы предложения
            hints // Сохраняем подсказки в отдельном поле
          };
        });

        if (sentencesToSave.length > 0) {

          const sentences = await sentenceHistoryRepository.addHistoryBatch(sentencesToSave);

          // Get the most recent sentence IDs matching our batch size
          sentenceIds = sentences.map(s => s.id);
        }
      } catch (_saveErr) {
        showAlert.warning('Failed to save generated sentence history');
      }
    }

    // Check which sentences have previous answers (для новых предложений всегда будет false)
    const hasAnswers: Record<string, boolean> = {};
    if (sentenceIds.length > 0) {
      const answersMap = await userAnswerRepository.checkAnswersExist({
        userId,
        sentenceIds
      });
      Object.assign(hasAnswers, answersMap);
    }

    return { 
      status: 200, 
      body: { 
        success: true, 
        data: { 
          data: result, 
          sentenceIds,
          hasAnswers // добавляем информацию о наличии ответов
        } 
      } 
    };
  } catch (_err) {
    showAlert.error('Unexpected error in generateText service');
    return { status: 500, body: { error: 'Internal server error' } };
  }
}
