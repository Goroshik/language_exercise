import {NextRequest, NextResponse} from 'next/server';

import {AIFactory} from 'src/services/aiFactory';
import {getUserIdFromRequest, createUnauthorizedResponse} from 'src/utils/auth';
import {GeneratedSentenceHistoryRepository} from 'src/repository/GeneratedSentenceHistoryRepository';
import {GRAMMAR_PROMPTS} from 'src/prompts/grammarPrompts';
import {DictionaryWord} from "src/types";

interface GenerateTextRequest {
  mode: string;
  topic: string;
  language: string;
  level: string;
  selectedWords: DictionaryWord[];
}

// Функция форматирования ответа от AI
function formatAIResponse(text: string): string[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => line.replace(/^\d+\.\s*/, '')); // Удаляем цифры и точку в начале
}

// POST /api/ai/generate-text - Generate text using AI
export async function POST(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const {userId, error} = getUserIdFromRequest(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    // Parse request body
    const body: GenerateTextRequest = await request.json();
    const {mode, topic, language, level, selectedWords} = body;

    if (!mode || !topic || !language || !level) {
      return NextResponse.json(
        {error: 'mode, topic, language, level, selectedWords are required'},
        {status: 400}
      );
    }

    // Формируем промт на сервере через GRAMMAR_PROMPTS
    let prompt = '';
    if (mode === 'learn') {
      prompt = GRAMMAR_PROMPTS.generateTeacherSentences(topic, level, selectedWords.map(w => w.word));
    } else {
      prompt = GRAMMAR_PROMPTS.generateExercises(topic, selectedWords.map(w => w.word));
    }

    const aiService = await AIFactory.getAIService(userId);
    const rawResult = await aiService.generateText!(prompt, userId);

    console.log('AI response:', rawResult);

    const result = formatAIResponse(rawResult.text);

    console.log('Formatted AI response:', result);

    // Сохраняем историю генерации
    if (result.length > 0) {
      await GeneratedSentenceHistoryRepository.addHistory({
        ownerId: userId,
        sentence: result.join('\n'),
        language,
        usedWordIds: selectedWords.map(w => w.id),
        level,
      });
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error in generate-text API:', error);

    // Handle specific token errors
    if (error instanceof Error && error.message.includes('No token found')) {
      return NextResponse.json(
        {error: 'AI service token not configured for user'},
        {status: 402} // Payment Required - indicates missing token
      );
    }

    return NextResponse.json(
      {error: 'Internal server error'},
      {status: 500}
    );
  }
}
