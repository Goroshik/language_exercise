import { NextRequest, NextResponse } from 'next/server';
import { essayRepository } from 'src/repository/client';
import { getUserIdFromRequest } from 'src/utils/auth';
import { safeJson } from 'src/utils/jsonWrapper';
import { NextResponseError } from 'src/utils/NextResponseError';

/**
 * GET /api/essays - List all essays for user
 * Query params: languageCode (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const languageCode = searchParams.get('languageCode') || undefined;

    const essays = await essayRepository.findByUser(userId, languageCode);

    return NextResponse.json({ success: true, data: essays }, { status: 200 });
  } catch (error) {
    if (error instanceof NextResponseError) {
      return error.response;
    }
    console.error('Error fetching essays:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/essays - Create a new essay
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await safeJson(request);

    const { title, content, languageCode } = body;

    if (!title || !content || !languageCode) {
      throw new NextResponseError('Missing required fields: title, content, languageCode', 400);
    }

    const essay = await essayRepository.create({
      userId,
      title,
      content,
      languageCode
    });

    return NextResponse.json({ success: true, data: essay }, { status: 201 });
  } catch (error) {
    if (error instanceof NextResponseError) {
      return error.response;
    }
    console.error('Error creating essay:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
