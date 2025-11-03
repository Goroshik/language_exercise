import { NextRequest, NextResponse } from 'next/server';

import { ChatService } from 'src/services/chatService';
import { getUserIdFromRequest } from 'src/utils/auth';
import { safeJson } from 'src/utils/jsonWrapper';
import { NextResponseError } from 'src/utils/NextResponseError';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await safeJson(request);

    const { message } = body;

    if (!message || typeof message !== 'string') {
      throw new NextResponseError('Message is required', 400);
    }

    const result = await ChatService.sendMessage({ message, userId });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof NextResponseError) {
      return error.response;
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    const messages = await ChatService.getChatHistory(userId, limit);

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    if (error instanceof NextResponseError) {
      return error.response;
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    await ChatService.clearChatHistory(userId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof NextResponseError) {
      return error.response;
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
