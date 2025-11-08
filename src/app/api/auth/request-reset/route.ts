import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordResetService } from 'src/services/passwordResetService';
import { safeJson } from 'src/utils/jsonWrapper';
import { NextResponseError } from 'src/utils/NextResponseError';

export async function POST(request: NextRequest) {
  try {
    const { email } = await safeJson(request);

    if (!email) {
      throw new NextResponseError('Email обязателен', 400);
    }

    // Get base URL from request headers
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    const result = await requestPasswordResetService(email, baseUrl);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof NextResponseError) {
      return error.response;
    }
    console.error('Request password reset error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Ошибка сервера' },
      { status: 500 }
    );
  }
}
