import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from 'src/utils/auth';
import { getAvailableModels } from 'src/services/aiModelsService';

/**
 * GET /api/ai/available-models
 * Returns available AI models based on user's tokens
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const availableModels = await getAvailableModels(userId);

    return NextResponse.json(availableModels);
  } catch (error) {
    console.error('Error fetching available models:', error);
    return NextResponse.json({ error: 'Failed to fetch available models' }, { status: 500 });
  }
}
