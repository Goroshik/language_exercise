import {NextRequest, NextResponse} from 'next/server';

import {AIFactory} from 'src/services/aiFactory';
import {getUserIdFromRequest, createUnauthorizedResponse} from 'src/utils/auth';

interface GenerateTextRequest {
  prompt: string;
}

// POST /api/ai/generate-text - Generate text using AI
export async function POST(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const { userId, error } = getUserIdFromRequest(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    // Parse request body
    const body: GenerateTextRequest = await request.json();
    const {prompt} = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        {error: 'Prompt parameter is required and must be a string'},
        {status: 400}
      );
    }

    // Create service instance and generate text
    const aiService = await AIFactory.getAIService(userId);
    const result = await aiService.generateText!(prompt, userId);

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
