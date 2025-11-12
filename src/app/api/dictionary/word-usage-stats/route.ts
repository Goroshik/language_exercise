import { NextRequest, NextResponse } from 'next/server';
import { wordUsageStatsRepository } from 'src/repository/client';
import { getUserIdFromRequest } from 'src/utils/auth';
import { NextResponseError } from 'src/utils/NextResponseError';

/**
 * GET /api/dictionary/word-usage-stats
 * 
 * Query parameters:
 * - wordId: Optional word ID to get stats for a specific word
 * - orderByCount: Optional boolean (true/false) to order by usage count (default: false, orders by last used)
 * 
 * Returns usage statistics for user's words
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    
    const wordId = searchParams.get('wordId');
    const orderByCount = searchParams.get('orderByCount') === 'true';

    if (wordId) {
      // Get stats for a specific word
      const stats = await wordUsageStatsRepository.getUsageStats(userId, wordId);
      return NextResponse.json({ 
        success: true, 
        data: stats || { count: 0, lastUsedAt: null } 
      }, { status: 200 });
    } else {
      // Get all stats for the user
      const stats = await wordUsageStatsRepository.getAllUsageStats(userId, orderByCount);
      return NextResponse.json({ 
        success: true, 
        data: stats 
      }, { status: 200 });
    }
  } catch (error) {
    if (error instanceof NextResponseError) {
      return error.response;
    }
    console.error('Error fetching word usage stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
