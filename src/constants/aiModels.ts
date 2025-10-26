/**
 * AI Models configuration and provider mappings
 */

export interface AIModel {
  value: string;
  label: string;
  provider: 'gemini' | 'openai' | 'anthropic';
}

export const AI_MODELS: AIModel[] = [
  // Gemini models
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'gemini' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'gemini' },
  { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite', provider: 'gemini' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'gemini' },
  { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash-Lite', provider: 'gemini' },

  // OpenAI models
  { value: 'gpt-5', label: 'GPT-5', provider: 'openai' },
  { value: 'gpt-5-mini', label: 'GPT-5 Mini', provider: 'openai' },
  { value: 'gpt-5-nano', label: 'GPT-5 Nano', provider: 'openai' },
  { value: 'gpt-4.1', label: 'GPT-4.1', provider: 'openai' },
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', provider: 'openai' },
  { value: 'gpt-4.1-nano', label: 'GPT-4.1 Nano', provider: 'openai' },
  { value: 'o3', label: 'O3', provider: 'openai' },
  { value: 'o4-mini', label: 'O4 Mini', provider: 'openai' },
  { value: 'gpt-4o', label: 'GPT-4o', provider: 'openai' },

  // Claude models
  { value: 'claude-haiku-4.x', label: 'Claude Haiku 4.x', provider: 'anthropic' },
  { value: 'claude-opus-4.x', label: 'Claude Opus 4.x', provider: 'anthropic' },
  { value: 'claude-sonnet-4.x', label: 'Claude Sonnet 4.x', provider: 'anthropic' },
  { value: 'claude-haiku-3.5', label: 'Claude Haiku 3.5', provider: 'anthropic' },
  { value: 'claude-sonnet-3.7', label: 'Claude Sonnet 3.7', provider: 'anthropic' },
  { value: 'claude-haiku-3', label: 'Claude Haiku 3', provider: 'anthropic' }
];

export const PROVIDER_LABELS: Record<string, string> = {
  gemini: 'Gemini',
  openai: 'OpenAI',
  anthropic: 'Claude'
};

/**
 * Get models for a specific provider
 */
export function getModelsByProvider(provider: 'gemini' | 'openai' | 'anthropic'): AIModel[] {
  return AI_MODELS.filter(model => model.provider === provider);
}

/**
 * Get provider name from model value
 */
export function getProviderFromModel(modelValue: string): 'gemini' | 'openai' | 'anthropic' | null {
  const model = AI_MODELS.find(m => m.value === modelValue);
  return model?.provider || null;
}

/**
 * Get model label from value
 */
export function getModelLabel(modelValue: string): string {
  const model = AI_MODELS.find(m => m.value === modelValue);
  return model?.label || modelValue;
}
