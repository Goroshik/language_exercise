import { NextRequest, NextResponse } from 'next/server';
import { essayRepository } from 'src/repository/client';
import { getUserIdFromRequest } from 'src/utils/auth';
import { safeJson } from 'src/utils/jsonWrapper';
import { NextResponseError } from 'src/utils/NextResponseError';

/**
 * GET /api/essays/[id] - Get a specific essay
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    const { id } = await params;

    const essay = await essayRepository.findByIdAndUser(id, userId);

    if (!essay) {
      throw new NextResponseError('Essay not found', 404);
    }

    return NextResponse.json({ success: true, data: essay }, { status: 200 });
  } catch (error) {
    if (error instanceof NextResponseError) {
      return error.response;
    }
    console.error('Error fetching essay:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/essays/[id] - Update an essay
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    const { id } = await params;
    const body = await safeJson(request);

    // Verify essay belongs to user
    const exists = await essayRepository.exists(id, userId);
    if (!exists) {
      throw new NextResponseError('Essay not found', 404);
    }

    const { title, content, aiResponse, level } = body;

    const essay = await essayRepository.update(id, {
      title,
      content,
      aiResponse,
      level
    });

    return NextResponse.json({ success: true, data: essay }, { status: 200 });
  } catch (error) {
    if (error instanceof NextResponseError) {
      return error.response;
    }
    console.error('Error updating essay:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/essays/[id] - Delete an essay
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    const { id } = await params;

    await essayRepository.delete(id, userId);

    return NextResponse.json({ success: true, message: 'Essay deleted' }, { status: 200 });
  } catch (error) {
    if (error instanceof NextResponseError) {
      return error.response;
    }
    console.error('Error deleting essay:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
