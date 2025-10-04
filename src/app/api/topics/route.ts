import {NextResponse} from 'next/server';
import topics from 'src/constants/topics_eng';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      topics
    });
  } catch (error) {
    console.error('Failed to get tags from database:', error);

    // Fallback to extracting from words if database fails
    return NextResponse.json({
      success: false,
      error: 'Failed to load tags',
      tags: []
    }, {status: 500});
  }
}
