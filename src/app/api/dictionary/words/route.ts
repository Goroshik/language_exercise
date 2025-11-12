import { NextRequest, NextResponse } from 'next/server';
import { userSettingsRepository } from 'src/repository/client';
import { addManyWordService, searchWordsService } from 'src/services/wordsService';
import { getUserIdFromRequest } from 'src/utils/auth';
import { safeJson } from 'src/utils/jsonWrapper';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const limitParam = searchParams.get('limit');
    const pageParam = searchParams.get('page');
    const sortByUsage = searchParams.get('sortByUsage') === 'true';
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const page = pageParam ? parseInt(pageParam, 10) : undefined;

    // Get user's learning language from settings
    const userSettings = await userSettingsRepository.findByUserId(userId);
    const languageCode = userSettings?.learningLanguage || undefined;

    // Используем сортировку по использованию если указан параметр sortByUsage=true
    const result = await searchWordsService(userId, query, languageCode, limit, page, sortByUsage);
      
    return NextResponse.json({ success: true, ...result });
  } catch (_error) {
    console.log('Error in GET /api/dictionary/words:', _error);
    return NextResponse.json(
      { success: false, error: 'Failed to load words', words: [], total: 0 },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    const { words } = await safeJson(request);
    if (!words?.length) {
      return NextResponse.json(
        { success: false, error: 'Word and translate are required' },
        { status: 400 }
      );
    }

    // Get user's learning language from settings
    const userSettings = await userSettingsRepository.findByUserId(userId);
    const languageCode = userSettings?.learningLanguage || 'en';

    // Add languageCode to each word if not already present
    // TODO: Fix type - create proper Word interface instead of using any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wordsWithLanguage = words.map((word: any) => ({
      ...word,
      languageCode: word.languageCode || languageCode
    }));

    const createdWord = await addManyWordService(userId, wordsWithLanguage);
    return NextResponse.json({ success: true, word: createdWord });
  } catch (_error) {
    return NextResponse.json({ success: false, error: 'Failed to add word' }, { status: 500 });
  }
}
