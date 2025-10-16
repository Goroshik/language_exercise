
import { NextRequest, NextResponse } from 'next/server';
import { createEventStream, getTextStream } from 'src/services/generateTextStreamService';
import { getUserIdFromRequest } from 'src/utils/auth';
import { safeJson } from 'src/utils/jsonWrapper';
import { NextResponseError } from 'src/utils/NextResponseError';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { prompt } = await safeJson(request);

    const textStream = await getTextStream(prompt, userId);
    const stream = createEventStream(textStream);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    if (error instanceof NextResponseError) {
      return error.response;
    }
    if (error instanceof Error && error.message.includes('No token found')) {
      return NextResponse.json({ error: 'AI service token not configured for user' }, { status: 402 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
