import Joi from 'joi';

import { GRAMMAR_PROMPTS } from 'src/prompts/grammarPrompts';
import { languageRepository, wordRepository, wordUsageStatsRepository } from 'src/repository/client';
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
  exercises: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      sentence: Joi.string().allow('').required()
    })
  ).required(),
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

    // Получаем название языка из настроек пользователя, если не передано
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

    // Фильтруем только непустые упражнения для отправки AI
    const nonEmptyExercises = exercises.filter(ex => ex.sentence.trim().length > 0);

    // Если нет ни одного предложения для проверки
    if (nonEmptyExercises.length === 0) {
      return { status: 400, body: { error: 'No sentences to check' } };
    }

    // Формируем JSON для промпта
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate answers via AI service';
      return { status: 502, body: { error: errorMessage } };
    }

    const text =
      typeof rawResult === 'string'
        ? rawResult
        : rawResult && typeof rawResult === 'object'
          ? ((rawResult as { text?: string }).text ?? '')
          : '';

    // Парсим JSON ответ от AI
    let aiResults: Array<CheckAnswerItem & { id: string }>;
    try {
      // Извлекаем JSON из ответа (AI может добавить markdown обертку)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in AI response');
      }
      aiResults = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('AI response:', text);
      // Fallback: возвращаем ошибку парсинга
      return { 
        status: 502, 
        body: { error: 'Failed to parse AI validation response. Please try again.' } 
      };
    }

    // Создаём карту результатов по ID
    const resultsById = new Map<string, CheckAnswerItem>();
    aiResults.forEach(result => {
      const { id, ...checkResult } = result;
      resultsById.set(id, checkResult);
    });

    // Извлекаем все слова из предложений пользователя для отслеживания использования
    const allUserWords: string[] = [];
    exercises.forEach(exercise => {
      if (exercise.sentence.trim()) {
        // Разбиваем предложение на слова и убираем знаки препинания
        const words = exercise.sentence
          .toLowerCase()
          .replace(/[^\p{Letter}\p{Mark}\s]/gu, '') // Убираем все кроме букв, диакритических знаков и пробелов
          .split(/\s+/)
          .filter(word => word.length > 1); // Только слова длиннее 1 символа
        allUserWords.push(...words);
      }
    });

    // Отслеживание использования слов в фоновом режиме (не блокирует основной поток)
    if (allUserWords.length > 0) {
      // Запускаем в фоновом режиме без await, чтобы не блокировать ответ
      trackWordUsage(userId, allUserWords).catch(trackingErr => {
        // Логируем ошибку, но не прерываем основной процесс
        console.error('Error tracking word usage:', trackingErr);
      });
    }

    // Создаём полный массив результатов с сохранением порядка из оригинального запроса
    const fullResults: CheckAnswerItem[] = exercises.map(exercise => {
      if (exercise.sentence.trim().length === 0) {
        return { isCorrect: true, skipped: true };
      }
      // Ищем результат по ID
      const result = resultsById.get(exercise.id);
      if (result) {
        return result;
      }
      // Если результат не найден (не должно произойти), считаем корректным
      return { isCorrect: true };
    });

    return { status: 200, body: { success: true, data: fullResults } };
  } catch (err) {
    console.error('Unexpected error in checkAnswers service:', err);
    return { status: 500, body: { error: 'Internal server error' } };
  }
}

/**
 * Отслеживает использование слов в фоновом режиме
 * Сопоставляет слова из предложений пользователя со словарем и увеличивает счетчики
 */
async function trackWordUsage(userId: string, userWords: string[]): Promise<void> {
  // Получаем настройки пользователя для определения изучаемого языка
  const userSettings = await getUserSettingsService(userId);
  const learningLanguageCode = userSettings.learningLanguage || 'en';

  // Получаем все слова пользователя для изучаемого языка
  const dictionaryWords = await wordRepository.getAllWords(userId, learningLanguageCode);
  
  // Создаем карту: слово в нижнем регистре -> ID слова
  const wordMap = new Map<string, string>();
  dictionaryWords.forEach(word => {
    // Сохраняем и оригинальное слово, и его версию в нижнем регистре для сопоставления
    if(word) wordMap.set(word.word.toLowerCase(), word.id);
  });

  // Находим совпадающие ID слов
  const matchedWordIds = new Set<string>();
  userWords.forEach(userWord => {
    const wordId = wordMap.get(userWord.toLowerCase());
    if (wordId) {
      matchedWordIds.add(wordId);
    }
  });

  // Увеличиваем счетчики использования для совпавших слов
  if (matchedWordIds.size > 0) {
    await wordUsageStatsRepository.incrementUsageForWords(
      userId,
      Array.from(matchedWordIds)
    );
  }
}
