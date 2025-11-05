import { NextRequest, NextResponse } from 'next/server';

import { userSettingsRepository } from 'src/repository/client';
import { getUserIdFromRequest } from 'src/utils/auth';
import { safeJson } from 'src/utils/jsonWrapper';

// GET /api/settings/topic?language=en - Get topic for specific language
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language');

    if (!language) {
      return NextResponse.json({ error: 'Language parameter is required' }, { status: 400 });
    }

    const topic = await userSettingsRepository.getTopicForLanguage(userId, language);
    return NextResponse.json({ topic });
  } catch (error) {
    console.error('Error fetching topic:', error);
    return NextResponse.json({ error: 'Failed to fetch topic' }, { status: 500 });
  }
}

// POST /api/settings/topic - Set topic for specific language
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await safeJson(request);
    const { language, topic } = body;

    if (!language || !topic) {
      return NextResponse.json(
        { error: 'Language and topic are required' },
        { status: 400 }
      );
    }

    await userSettingsRepository.setTopicForLanguage(userId, language, topic);
    return NextResponse.json({ success: true, topic });
  } catch (error) {
    console.error('Error saving topic:', error);
    return NextResponse.json({ error: 'Failed to save topic' }, { status: 500 });
  }
}
