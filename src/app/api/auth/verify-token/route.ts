import { NextRequest, NextResponse } from 'next/server';
import { verifyResetTokenService } from 'src/services/passwordResetService';
import { NextResponseError } from 'src/utils/NextResponseError';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      throw new NextResponseError('Token обязателен', 400);
    }

    const result = await verifyResetTokenService(token);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof NextResponseError) {
      return error.response;
    }
    console.error('Verify token error:', error);
    return NextResponse.json(
      { valid: false, error: error instanceof Error ? error.message : 'Ошибка сервера' },
      { status: 500 }
    );
  }
}
