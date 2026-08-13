/**
 * Rules for choosing which AI model the selector shows.
 *
 * Kept out of the component so the decisions can be tested without rendering.
 */
import { type AIModel, getModelsByProvider, getProviderFromModel } from 'src/constants/aiModels';

export type Provider = 'gemini' | 'openai' | 'anthropic';

export const DEFAULT_AI_MODEL = 'gemini-2.5-flash';

export interface ModelSelection {
  provider: Provider;
  model: string;
}

/** First available provider together with its first model, if any. */
export function pickDefaultSelection(providers: Provider[]): ModelSelection | null {
  const provider = providers[0];
  if (!provider) return null;

  const model = getModelsByProvider(provider)[0];
  return model ? { provider, model: model.value } : null;
}

/**
 * What the form should start on: the user's saved model when its provider is
 * still available, otherwise the first provider the user has a token for.
 */
export function resolveInitialSelection(
  savedModel: string,
  providers: Provider[]
): ModelSelection | null {
  const provider = getProviderFromModel(savedModel);

  return provider !== null && providers.includes(provider)
    ? { provider, model: savedModel }
    : pickDefaultSelection(providers);
}

/**
 * The model to switch to after the provider changed, or null when the current
 * model already belongs to that provider.
 */
export function nextModelForProvider(provider: Provider, currentModel: string): string | null {
  const models = getModelsByProvider(provider);
  const first = models[0];

  if (!first) return null;
  return models.some(model => model.value === currentModel) ? null : first.value;
}

/** Models offered for the selected provider; nothing until one is chosen. */
export function modelsForProvider(provider: Provider | ''): AIModel[] {
  return provider ? getModelsByProvider(provider) : [];
}
