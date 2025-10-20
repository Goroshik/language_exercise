import { NextResponse } from 'next/server';
import { getTopicsService } from 'src/services/topicsService';

export async function GET() {
  try {
    const topics = getTopicsService();
    return NextResponse.json({ success: true, topics });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to load tags', tags: [] },
      { status: 500 }
    );
  }
}
