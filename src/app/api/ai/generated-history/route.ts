import { NextRequest, NextResponse } from 'next/server';
import { getGeneratedHistoryService } from 'src/services/generatedHistoryService';
import { getUserIdFromRequest } from 'src/utils/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    const searchParams = request.nextUrl.searchParams;
    const languageId = searchParams.get('languageId') || undefined;
    const level = searchParams.get('level') || undefined;
    const searchText = searchParams.get('searchText') || undefined;
    const usedWordIdsParam = searchParams.get('usedWordIds');
    const usedWordIds = usedWordIdsParam ? usedWordIdsParam.split(',') : undefined;

    const history = await getGeneratedHistoryService(userId, {
      languageId,
      level,
      usedWordIds,
      searchText
    });

    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    console.error('Error fetching generated history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch history', data: [] },
      { status: 500 }
    );
  }
}
