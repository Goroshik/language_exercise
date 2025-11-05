import { NextRequest, NextResponse } from 'next/server';

import { userSettingsRepository } from 'src/repository/client';
import { getUserIdFromRequest } from 'src/utils/auth';
import { safeJson } from 'src/utils/jsonWrapper';

// GET /api/settings/level?language=en - Get level for specific language
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language');

    if (!language) {
      return NextResponse.json({ error: 'Language parameter is required' }, { status: 400 });
    }

    const level = await userSettingsRepository.getLevelForLanguage(userId, language);
    return NextResponse.json({ level });
  } catch (error) {
    console.error('Error fetching level:', error);
    return NextResponse.json({ error: 'Failed to fetch level' }, { status: 500 });
  }
}

// POST /api/settings/level - Set level for specific language
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await safeJson(request);
    const { language, level } = body;

    if (!language || !level) {
      return NextResponse.json(
        { error: 'Language and level are required' },
        { status: 400 }
      );
    }

    await userSettingsRepository.setLevelForLanguage(userId, language, level);
    return NextResponse.json({ success: true, level });
  } catch (error) {
    console.error('Error saving level:', error);
    return NextResponse.json({ error: 'Failed to save level' }, { status: 500 });
  }
}
