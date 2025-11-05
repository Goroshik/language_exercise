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
    // TODO: Fix type - use proper Error type instead of any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Ошибка сервера' }, { status: 500 });
  }
}
