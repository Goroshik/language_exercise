import Joi from 'joi';
import { GRAMMAR_PROMPTS } from 'src/prompts/grammarPrompts';
import { sentenceHistoryRepository, languageRepository } from 'src/repository/client';
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
}

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
    .optional()
});

export function formatAIResponse(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => line.replace(/^[\d\)\.\-\*\s]+/, ''));
}

export async function processGenerateTextRequest(
  rawBody: unknown,
  userId: string
): Promise<ServiceResponse> {
  try {
    const validation = schema.validate(rawBody, { abortEarly: false, stripUnknown: true });
    const { error, value } = validation as { error?: any; value: any };
    if (error) {
      const messages: string[] = (error.details || []).map((d: any) => String(d.message));
      return { status: 400, body: { error: messages.join('; ') } };
    }

    const body = value as GenerateTextRequest;
    const { mode, topic, languageId, level, selectedWords = [] } = body;

    // Fetch language by ID
    const language = await languageRepository.findById(languageId);
    if (!language) {
      return { status: 400, body: { error: 'Invalid language ID' } };
    }

    const words = selectedWords.map(w => w.word || '');
    const prompt =
      mode === 'student'
        ? GRAMMAR_PROMPTS.generateStudentExercises(topic, language.name, words)
        : GRAMMAR_PROMPTS.generateTeacherExamples(topic, level, language.name, words);

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
              wordsInSentence.add(wordMap.get(word)!);
            }
          }

          // Удаляем подсказки из предложения перед сохранением в историю
          // Формат подсказок: (hint text) в конце предложения
          const sentenceWithoutHints = sentence.replace(/\s*\([^)]+\)\s*$/, '').trim();

          // Возвращаем запись даже если нет найденных слов (с пустым массивом)
          return {
            ownerId: userId,
            sentence: sentenceWithoutHints,
            languageId,
            usedWordIds: Array.from(wordsInSentence),
            level,
            mode, // Сохраняем режим генерации (student/teacher)
            topic // Сохраняем топик, под которым были сгенерированы предложения
          };
        });

        if (sentencesToSave.length > 0) {
          const savedSentences = await sentenceHistoryRepository.addHistoryBatch(sentencesToSave);
          
          // Get the IDs of saved sentences
          // Since addHistoryBatch returns a count, we need to fetch the recently created sentences
          const recentSentences = await sentenceHistoryRepository.getHistory({
            ownerId: userId,
            languageId,
            level
          });
          
          // Match sentences to get IDs (take the most recent ones matching our count)
          sentenceIds = recentSentences
            .slice(0, result.length)
            .map(s => s.id);
        }
      } catch (saveErr) {
        showAlert.warning('Failed to save generated sentence history');
      }
    }

    return { status: 200, body: { success: true, data: result, sentenceIds } };
  } catch (err) {
    showAlert.error('Unexpected error in generateText service');
    return { status: 500, body: { error: 'Internal server error' } };
  }
}
