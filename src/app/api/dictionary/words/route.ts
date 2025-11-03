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

    // Get user's learning language from settings
    const userSettings = await userSettingsRepository.findByUserId(userId);
    const languageCode = userSettings?.learningLanguage || undefined;

    const words = await searchWordsService(userId, query, languageCode);
    return NextResponse.json({ success: true, words });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to load words', words: [] },
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
    const wordsWithLanguage = words.map((word: any) => ({
      ...word,
      languageCode: word.languageCode || languageCode
    }));

    const createdWord = await addManyWordService(userId, wordsWithLanguage);
    return NextResponse.json({ success: true, word: createdWord });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to add word' }, { status: 500 });
  }
}
