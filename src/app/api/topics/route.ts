import { NextRequest, NextResponse } from 'next/server';
import { getTopicsService } from 'src/services/topicsService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const language = searchParams.get('language') || 'en';
    const topics = getTopicsService(language);
    return NextResponse.json({ success: true, topics });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to load topics', topics: [] },
      { status: 500 }
    );
  }
}
