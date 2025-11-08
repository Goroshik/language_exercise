import { NextRequest, NextResponse } from 'next/server';
import { checkEssayService } from 'src/services/checkEssayService';
import { getUserIdFromRequest } from 'src/utils/auth';
import { safeJson } from 'src/utils/jsonWrapper';
import { NextResponseError } from 'src/utils/NextResponseError';

/**
 * POST /api/essays/check - Check essay with AI
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await safeJson(request);

    const result = await checkEssayService(body, userId);

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    if (error instanceof NextResponseError) {
      return error.response;
    }
    console.error('Error checking essay:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
