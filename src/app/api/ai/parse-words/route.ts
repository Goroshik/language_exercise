import {NextRequest, NextResponse} from 'next/server';
import {GoogleAIService} from 'src/services/googleAI';
import {TokenService} from 'src/utils/tokenService';

interface ParseWordsRequest {
  text: string;
}

// POST /api/ai/parse-words - Parse text and extract words with translations
export async function POST(request: NextRequest) {
  try {
    // Get user ID from middleware headers
    const userId = TokenService.getUserIdFromRequest(request);


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
    const googleAI = new GoogleAIService();
    const parsedWords = await googleAI.parseWordsFromText(text, userId || 'qwe');

    return NextResponse.json({
      success: true,
      data: parsedWords
    });

  } catch (error) {
    console.error('Error in parse-words API:', error);

    // Handle specific token errors
    if (error instanceof Error && error.message.includes('No token found')) {
      return NextResponse.json(
        {error: 'Google AI token not configured for user'},
        {status: 402} // Payment Required - indicates missing token
      );
    }

    return NextResponse.json(
      {error: 'Internal server error'},
      {status: 500}
    );
  }
}
