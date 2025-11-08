import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordService } from 'src/services/passwordResetService';
import { safeJson } from 'src/utils/jsonWrapper';
import { NextResponseError } from 'src/utils/NextResponseError';

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await safeJson(request);

    if (!token || !newPassword) {
      throw new NextResponseError('Token и новый пароль обязательны', 400);
    }

    if (newPassword.length < 6) {
      throw new NextResponseError('Пароль должен содержать минимум 6 символов', 400);
    }

    const result = await resetPasswordService(token, newPassword);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof NextResponseError) {
      return error.response;
    }
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Ошибка сервера' },
      { status: 500 }
    );
  }
}
