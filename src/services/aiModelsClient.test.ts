import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_AI_MODEL } from 'src/utils/aiModelSelection';
import { EMPTY_AVAILABLE, loadAiModelOptions, saveAiModel } from './aiModelsClient';

const AVAILABLE = { providers: ['gemini'], models: [], hasTokens: true };

const ok = (body: unknown) => ({ ok: true, json: () => Promise.resolve(body) });
const notOk = () => ({ ok: false, json: () => Promise.resolve({}) });

/** First call is /api/ai/available-models, second is /api/settings. */
const stubFetch = (models: unknown, settings: unknown) => {
  const mock = vi
    .fn()
    .mockImplementation((url: string) =>
      Promise.resolve(url === '/api/settings' ? settings : models)
    );
  vi.stubGlobal('fetch', mock);
  return mock;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('EMPTY_AVAILABLE', () => {
  it('describes a user with no tokens', () => {
    expect(EMPTY_AVAILABLE).toEqual({ providers: [], models: [], hasTokens: false });
  });
});

describe('loadAiModelOptions', () => {
  it('returns the available providers and the saved model', async () => {
    stubFetch(ok(AVAILABLE), ok({ aiModel: 'gpt-4o' }));
    await expect(loadAiModelOptions()).resolves.toEqual({
      available: AVAILABLE,
      savedModel: 'gpt-4o'
    });
  });

  it('asks both endpoints', async () => {
    const fetchMock = stubFetch(ok(AVAILABLE), ok({}));
    await loadAiModelOptions();

    const urls = fetchMock.mock.calls.map(call => call[0]);
    expect(urls).toContain('/api/ai/available-models');
    expect(urls).toContain('/api/settings');
  });

  it('falls back to the default model when settings carry none', async () => {
    stubFetch(ok(AVAILABLE), ok({}));
    await expect(loadAiModelOptions()).resolves.toMatchObject({ savedModel: DEFAULT_AI_MODEL });
  });

  it('reports no saved model when settings cannot be read', async () => {
    stubFetch(ok(AVAILABLE), notOk());
    await expect(loadAiModelOptions()).resolves.toEqual({
      available: AVAILABLE,
      savedModel: null
    });
  });

  it('still returns the provider list when settings fail', async () => {
    stubFetch(ok(AVAILABLE), notOk());
    const { available } = await loadAiModelOptions();
    expect(available.hasTokens).toBe(true);
  });

  it('fails when the model list cannot be read', async () => {
    stubFetch(notOk(), ok({}));
    await expect(loadAiModelOptions()).rejects.toThrow(/Failed to fetch available models/);
  });

  it('propagates a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(loadAiModelOptions()).rejects.toThrow('offline');
  });
});

describe('saveAiModel', () => {
  it('posts the model as JSON', async () => {
    const mock = vi.fn().mockResolvedValue(ok({}));
    vi.stubGlobal('fetch', mock);

    await saveAiModel('gpt-4o');

    expect(mock).toHaveBeenCalledWith('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aiModel: 'gpt-4o' })
    });
  });

  it('resolves when the server accepts it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({})));
    await expect(saveAiModel('gpt-4o')).resolves.toBeUndefined();
  });

  it('fails when the server rejects it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(notOk()));
    await expect(saveAiModel('gpt-4o')).rejects.toThrow(/Failed to save settings/);
  });

  it('propagates a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(saveAiModel('gpt-4o')).rejects.toThrow('offline');
  });
});
