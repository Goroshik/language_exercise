import { userTokenRepository } from 'src/repository/client';
import { AI_MODELS } from 'src/constants/aiModels';

export interface AvailableModelsResponse {
  providers: Array<'gemini' | 'openai' | 'anthropic'>;
  models: Array<{ value: string; label: string; provider: 'gemini' | 'openai' | 'anthropic' }>;
  hasTokens: boolean;
}

/**
 * Get available AI models based on user's tokens
 */
export async function getAvailableModels(userId: string): Promise<AvailableModelsResponse> {
  // Get all user tokens
  const tokens = await userTokenRepository.findByUser(userId);

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
    .map(([, provider]) => provider);

  // Get models for available providers
  const availableModels = AI_MODELS.filter(model => availableProviders.includes(model.provider));

  return {
    providers: availableProviders,
    models: availableModels,
    hasTokens: availableProviders.length > 0
  };
}
