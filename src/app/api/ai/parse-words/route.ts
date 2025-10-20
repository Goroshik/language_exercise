import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from 'src/utils/auth';
import { safeJson } from 'src/utils/jsonWrapper';
import { NextResponseError } from 'src/utils/NextResponseError';

// POST /api/ai/parse-words - Parse text and extract words with translations
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { text } = await safeJson(request);
    const words = await parseWordsFromTextService(text, userId);
    return NextResponse.json({ words });
  } catch (error) {
    console.error('Error in parse-words API:', error);
    if (error instanceof NextResponseError) {
      return error.response;
    }
    if (error instanceof Error && error.message.includes('No token found')) {
      return NextResponse.json(
        { error: 'AI service token not configured for user' },
        { status: 402 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { parseWordsFromTextService } from 'src/services/parseWordsFromTextService';
