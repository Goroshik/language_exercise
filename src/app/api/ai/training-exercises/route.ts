import { NextRequest, NextResponse } from 'next/server';
import { getTrainingExercisesService } from 'src/services/trainingExercisesService';
import { getUserIdFromRequest } from 'src/utils/auth';
import { NextResponseError } from 'src/utils/NextResponseError';
import { safeJson } from 'src/utils/jsonWrapper';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await safeJson(request);

    const result = await getTrainingExercisesService(body, userId);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    if (error instanceof NextResponseError) {
      return error.response;
    }
    console.error('Error in training exercises route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
