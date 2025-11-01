import { NextRequest, NextResponse } from 'next/server';
import { userAnswerRepository } from 'src/repository/client';
import { getUserIdFromRequest } from 'src/utils/auth';
import { safeJson } from 'src/utils/jsonWrapper';
import { NextResponseError } from 'src/utils/NextResponseError';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await safeJson(request);

    const { sentenceId, answer } = body;

    if (!sentenceId || typeof sentenceId !== 'string') {
      return NextResponse.json({ error: 'sentenceId is required' }, { status: 400 });
    }

    if (typeof answer !== 'string') {
      return NextResponse.json({ error: 'answer must be a string' }, { status: 400 });
    }

    const savedAnswer = await userAnswerRepository.saveAnswer({
      userId,
      sentenceId,
      answer
    });

    return NextResponse.json({ success: true, data: savedAnswer }, { status: 200 });
  } catch (error) {
    if (error instanceof NextResponseError) {
      return error.response;
    }
    console.error('Error saving user answer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const sentenceIdsParam = searchParams.get('sentenceIds');

    if (!sentenceIdsParam) {
      return NextResponse.json({ error: 'sentenceIds parameter is required' }, { status: 400 });
    }

    const sentenceIds = sentenceIdsParam.split(',').filter(Boolean);

    if (sentenceIds.length === 0) {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    const answers = await userAnswerRepository.getAnswersBySentenceIds({
      userId,
      sentenceIds
    });

    return NextResponse.json({ success: true, data: answers }, { status: 200 });
  } catch (error) {
    if (error instanceof NextResponseError) {
      return error.response;
    }
    console.error('Error fetching user answers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
