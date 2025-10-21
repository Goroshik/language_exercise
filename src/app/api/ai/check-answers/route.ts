import { NextRequest, NextResponse } from 'next/server';

import { processCheckAnswersRequest } from 'src/services/checkAnswersService';
import { getUserIdFromRequest } from 'src/utils/auth';
import { safeJson } from 'src/utils/jsonWrapper';
import { NextResponseError } from 'src/utils/NextResponseError';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await safeJson(request);

    const result = await processCheckAnswersRequest(body, userId);

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    if (error instanceof NextResponseError) {
      return error.response;
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
