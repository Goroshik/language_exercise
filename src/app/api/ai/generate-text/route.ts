import { NextRequest, NextResponse } from 'next/server';
import { GoogleAIService } from 'src/services/googleAI';
import { TokenService } from 'src/utils/tokenService';

interface GenerateTextRequest {
  prompt: string;
}

// POST /api/ai/generate-text - Generate text using AI
export async function POST(request: NextRequest) {
  try {
    // Get user ID from middleware headers
    const userId = TokenService.getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: GenerateTextRequest = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt parameter is required and must be a string' },
        { status: 400 }
      );
    }

    // Create service instance and generate text
    const googleAI = new GoogleAIService();
    const result = await googleAI.generateText(prompt, userId);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error in generate-text API:', error);

    // Handle specific token errors
    if (error instanceof Error && error.message.includes('No token found')) {
      return NextResponse.json(
        { error: 'Google AI token not configured for user' },
        { status: 402 } // Payment Required - indicates missing token
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
