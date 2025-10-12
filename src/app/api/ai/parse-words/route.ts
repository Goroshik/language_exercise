import {NextRequest, NextResponse} from 'next/server';
import {AIFactory} from 'src/services/aiFactory';
import {getUserIdFromRequest, createUnauthorizedResponse} from 'src/utils/auth';

interface ParseWordsRequest {
  text: string;
}

// POST /api/ai/parse-words - Parse text and extract words with translations
export async function POST(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const { userId, error } = getUserIdFromRequest(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    // Parse request body
    const body: ParseWordsRequest = await request.json();
    const {text} = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        {error: 'Text parameter is required and must be a string'},
        {status: 400}
      );
    }

    // Create service instance and parse words
    const aiService = await AIFactory.getAIService(userId);
    const parsedWords = await aiService.parseWordsFromText!(text, userId);

    return NextResponse.json({
      success: true,
      data: parsedWords
    });

  } catch (error) {
    console.error('Error in parse-words API:', error);

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
