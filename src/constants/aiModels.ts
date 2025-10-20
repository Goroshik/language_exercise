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
  { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Experimental)', provider: 'gemini' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'gemini' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', provider: 'gemini' },
  { value: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro', provider: 'gemini' },
  
  // OpenAI models
  { value: 'gpt-4o', label: 'GPT-4o', provider: 'openai' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'openai' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'openai' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'openai' },
  
  // Claude models
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', provider: 'anthropic' },
  { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus', provider: 'anthropic' },
  { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet', provider: 'anthropic' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', provider: 'anthropic' }
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
