import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/essays/default-topics - Get default essay topics
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const languageCode = searchParams.get('languageCode') || 'en';

  const topicsByLanguage: Record<string, string[]> = {
    en: [
      'My Daily Routine',
      'My Favorite Hobby',
      'A Memorable Trip',
      'My Family',
      'My Future Plans',
      'Technology in Our Lives',
      'Environmental Issues',
      'Education and Learning',
      'Health and Fitness',
      'Cultural Differences'
    ],
    pl: [
      'Moja codzienna rutyna',
      'Moje ulubione hobby',
      'Niezapomniana podróż',
      'Moja rodzina',
      'Moje plany na przyszłość',
      'Technologia w naszym życiu',
      'Problemy środowiskowe',
      'Edukacja i nauka',
      'Zdrowie i fitness',
      'Różnice kulturowe'
    ]
  };

  const topics = topicsByLanguage[languageCode] || topicsByLanguage['en'];

  return NextResponse.json({ success: true, data: topics }, { status: 200 });
}
