import { describe, expect, it } from 'vitest';
import {
  AI_MODELS,
  PROVIDER_LABELS,
  getModelLabel,
  getModelsByProvider,
  getProviderFromModel
} from './aiModels';

describe('AI_MODELS', () => {
  it('has a unique value per model', () => {
    const values = AI_MODELS.map(model => model.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it('only uses providers that have a label', () => {
    for (const model of AI_MODELS) {
      expect(PROVIDER_LABELS[model.provider]).toBeDefined();
    }
  });
});

describe('getModelsByProvider', () => {
  it.each(['gemini', 'openai', 'anthropic'] as const)('returns only %s models', provider => {
    const models = getModelsByProvider(provider);
    expect(models.length).toBeGreaterThan(0);
    expect(models.every(model => model.provider === provider)).toBe(true);
  });

  it('partitions the full list without loss', () => {
    const total = (['gemini', 'openai', 'anthropic'] as const).reduce(
      (sum, provider) => sum + getModelsByProvider(provider).length,
      0
    );
    expect(total).toBe(AI_MODELS.length);
  });
});

/** AI_MODELS is a hand-written constant; an empty list is a bug in itself. */
function firstModel() {
  const model = AI_MODELS[0];
  if (!model) throw new Error('AI_MODELS must not be empty');
  return model;
}

describe('getProviderFromModel', () => {
  it('resolves a known model to its provider', () => {
    const first = firstModel();
    expect(getProviderFromModel(first.value)).toBe(first.provider);
  });

  it('returns null for an unknown model', () => {
    expect(getProviderFromModel('gpt-nonexistent')).toBeNull();
  });

  it('returns null for an empty value', () => {
    expect(getProviderFromModel('')).toBeNull();
  });

  it('round-trips every model through getModelsByProvider', () => {
    for (const model of AI_MODELS) {
      const provider = getProviderFromModel(model.value);
      expect(provider).toBe(model.provider);
      expect(getModelsByProvider(model.provider)).toContainEqual(model);
    }
  });
});

describe('getModelLabel', () => {
  it('returns the label of a known model', () => {
    const first = firstModel();
    expect(getModelLabel(first.value)).toBe(first.label);
  });

  it('falls back to the raw value for an unknown model', () => {
    expect(getModelLabel('gpt-nonexistent')).toBe('gpt-nonexistent');
  });
});
