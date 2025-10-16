import { NextRequest, NextResponse } from 'next/server';
import { translateWordService } from 'src/services/translateService';
import { getUserIdFromRequest } from 'src/utils/auth';
import { safeJson } from 'src/utils/jsonWrapper';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { word } = await safeJson(request);
    const result = await translateWordService(userId, word);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Ошибка сервера' }, { status: 500 });
  }
}

