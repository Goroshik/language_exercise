import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from 'src/utils/auth';
import { userTokenRepository } from 'src/repository/client';
import { AI_MODELS, getModelsByProvider } from 'src/constants/aiModels';

/**
 * GET /api/ai/available-models
 * Returns available AI models based on user's tokens
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    
    // Get all user tokens
    const tokens = await userTokenRepository.findByUserId(userId);
    
    // Extract services that have tokens
    const availableServices = new Set(tokens.map(token => token.service));
    
    // Map service names to providers
    const providerMap: Record<string, 'gemini' | 'openai' | 'anthropic'> = {
      gemini: 'gemini',
      openai: 'openai',
      anthropic: 'anthropic'
    };
    
    // Get available providers based on tokens
    const availableProviders = Object.entries(providerMap)
      .filter(([service]) => availableServices.has(service))
      .map(([_, provider]) => provider);
    
    // Get models for available providers
    const availableModels = AI_MODELS.filter(model => 
      availableProviders.includes(model.provider)
    );
    
    return NextResponse.json({
      providers: availableProviders,
      models: availableModels,
      hasTokens: availableProviders.length > 0
    });
  } catch (error) {
    console.error('Error fetching available models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available models' },
      { status: 500 }
    );
  }
}
