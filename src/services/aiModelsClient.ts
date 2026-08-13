/**
 * Browser-side calls behind the AI model selector.
 */
import type { AIModel } from 'src/constants/aiModels';
import { DEFAULT_AI_MODEL, type Provider } from 'src/utils/aiModelSelection';

export interface AvailableModelsResponse {
  providers: Provider[];
  models: AIModel[];
  hasTokens: boolean;
}

export interface AiModelOptions {
  available: AvailableModelsResponse;
  savedModel: string | null;
}

export const EMPTY_AVAILABLE: AvailableModelsResponse = {
  providers: [],
  models: [],
  hasTokens: false
};

/**
 * The providers the user has tokens for, plus the model they saved earlier.
 * Settings are best-effort: a failure there still leaves the list usable, so
 * `savedModel` comes back null rather than throwing.
 */
export async function loadAiModelOptions(): Promise<AiModelOptions> {
  const [modelsResponse, settingsResponse] = await Promise.all([
    fetch('/api/ai/available-models'),
    fetch('/api/settings')
  ]);

  if (!modelsResponse.ok) {
    throw new Error('Failed to fetch available models');
  }

  const available: AvailableModelsResponse = await modelsResponse.json();
  if (!settingsResponse.ok) {
    return { available, savedModel: null };
  }

  const settings = await settingsResponse.json();
  return { available, savedModel: settings.aiModel || DEFAULT_AI_MODEL };
}

export async function saveAiModel(model: string): Promise<void> {
  const response = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ aiModel: model })
  });

  if (!response.ok) {
    throw new Error('Failed to save settings');
  }
}
