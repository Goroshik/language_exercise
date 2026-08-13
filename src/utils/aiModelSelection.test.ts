import { describe, expect, it } from 'vitest';
import { AI_MODELS } from 'src/constants/aiModels';
import {
  DEFAULT_AI_MODEL,
  type Provider,
  modelsForProvider,
  nextModelForProvider,
  pickDefaultSelection,
  resolveInitialSelection
} from './aiModelSelection';

const ALL: Provider[] = ['gemini', 'openai', 'anthropic'];
const firstModelOf = (provider: Provider) => {
  const model = AI_MODELS.find(m => m.provider === provider);
  if (!model) throw new Error(`no model for ${provider}`);
  return model.value;
};

describe('pickDefaultSelection', () => {
  it('takes the first provider and its first model', () => {
    expect(pickDefaultSelection(['openai'])).toEqual({
      provider: 'openai',
      model: firstModelOf('openai')
    });
  });

  it('prefers the first entry when several providers are available', () => {
    expect(pickDefaultSelection(['anthropic', 'gemini'])?.provider).toBe('anthropic');
  });

  it('returns null when no provider is available', () => {
    expect(pickDefaultSelection([])).toBeNull();
  });
});

describe('resolveInitialSelection', () => {
  it('keeps the saved model when its provider is available', () => {
    const saved = firstModelOf('openai');
    expect(resolveInitialSelection(saved, ALL)).toEqual({ provider: 'openai', model: saved });
  });

  it('falls back when the saved model belongs to an unavailable provider', () => {
    const saved = firstModelOf('openai');
    expect(resolveInitialSelection(saved, ['gemini'])).toEqual({
      provider: 'gemini',
      model: firstModelOf('gemini')
    });
  });

  it('falls back when the saved model is unknown', () => {
    expect(resolveInitialSelection('gpt-nonexistent', ['gemini'])?.provider).toBe('gemini');
  });

  it('returns null when nothing is available at all', () => {
    expect(resolveInitialSelection(DEFAULT_AI_MODEL, [])).toBeNull();
  });

  it('accepts the default model as a saved value', () => {
    expect(resolveInitialSelection(DEFAULT_AI_MODEL, ['gemini'])).toEqual({
      provider: 'gemini',
      model: DEFAULT_AI_MODEL
    });
  });
});

describe('nextModelForProvider', () => {
  it('switches to the first model of the new provider', () => {
    expect(nextModelForProvider('openai', firstModelOf('gemini'))).toBe(firstModelOf('openai'));
  });

  it('keeps a model that already belongs to the provider', () => {
    expect(nextModelForProvider('openai', firstModelOf('openai'))).toBeNull();
  });

  it('switches away from an unknown model', () => {
    expect(nextModelForProvider('gemini', 'nonsense')).toBe(firstModelOf('gemini'));
  });

  it('switches away from an empty model', () => {
    expect(nextModelForProvider('gemini', '')).toBe(firstModelOf('gemini'));
  });

  it.each(ALL)('has a first model for %s', provider => {
    expect(nextModelForProvider(provider, '')).toBe(firstModelOf(provider));
  });
});

describe('modelsForProvider', () => {
  it('lists only the models of that provider', () => {
    const models = modelsForProvider('openai');
    expect(models.length).toBeGreaterThan(0);
    expect(models.every(model => model.provider === 'openai')).toBe(true);
  });

  it('lists nothing before a provider is chosen', () => {
    expect(modelsForProvider('')).toEqual([]);
  });
});
