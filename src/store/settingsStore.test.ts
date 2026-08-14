import { beforeEach, describe, expect, it, vi } from 'vitest';

const dispatchEvent = vi.fn();
vi.stubGlobal('window', { dispatchEvent, CustomEvent });
vi.stubGlobal('CustomEvent', class extends Event {});

const { defaultSettings, useSettingsStore } = await import('./settingsStore');

const ok = (body: unknown) => ({ ok: true, json: () => Promise.resolve(body) });
const notOk = () => ({ ok: false, json: () => Promise.resolve({}) });

const stubFetch = (response: unknown) => {
  const mock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', mock);
  return mock;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  useSettingsStore.setState({
    settings: null,
    isLoading: false,
    error: null,
    topics: null,
    isLoadingTopics: false
  });
});

/** A fetch that stays pending until the returned resolve is called. */
const deferredFetch = (body: unknown) => {
  let release: () => void = () => {};
  const pending = new Promise(resolve => {
    release = () => resolve(ok(body));
  });
  vi.stubGlobal('fetch', vi.fn().mockReturnValue(pending));
  return { release: () => release() };
};

describe('in-flight flags', () => {
  it('marks settings as loading while the request runs', async () => {
    const { release } = deferredFetch({});
    const done = useSettingsStore.getState().loadSettings();

    expect(useSettingsStore.getState().isLoading).toBe(true);
    release();
    await done;
    expect(useSettingsStore.getState().isLoading).toBe(false);
  });

  it('clears a previous error when loading again', async () => {
    useSettingsStore.setState({ error: 'stale' });
    const { release } = deferredFetch({});
    const done = useSettingsStore.getState().loadSettings();

    expect(useSettingsStore.getState().error).toBeNull();
    release();
    await done;
  });

  it('marks settings as loading while an update runs', async () => {
    useSettingsStore.setState({ settings: defaultSettings });
    const { release } = deferredFetch({});
    const done = useSettingsStore.getState().updateSettings({ theme: 'dark' });

    expect(useSettingsStore.getState().isLoading).toBe(true);
    release();
    await done;
    expect(useSettingsStore.getState().isLoading).toBe(false);
  });

  it('clears a previous error when updating', async () => {
    useSettingsStore.setState({ settings: defaultSettings, error: 'stale' });
    const { release } = deferredFetch({});
    const done = useSettingsStore.getState().updateSettings({ theme: 'dark' });

    expect(useSettingsStore.getState().error).toBeNull();
    release();
    await done;
  });

  it('marks topics as loading while they are fetched', async () => {
    const { release } = deferredFetch({ success: true, topics: {} });
    const done = useSettingsStore.getState().loadTopics('pl');

    expect(useSettingsStore.getState().isLoadingTopics).toBe(true);
    release();
    await done;
    expect(useSettingsStore.getState().isLoadingTopics).toBe(false);
  });

  it('does not touch the topics loading flag while settings load', async () => {
    const { release } = deferredFetch({});
    const done = useSettingsStore.getState().loadSettings();

    expect(useSettingsStore.getState().isLoadingTopics).toBe(false);
    release();
    await done;
  });
});

describe('loadSettings', () => {
  it('asks the settings endpoint', async () => {
    const fetchMock = stubFetch(ok({}));
    await useSettingsStore.getState().loadSettings();
    expect(fetchMock).toHaveBeenCalledWith('/api/settings');
  });

  it('merges the server settings over the defaults', async () => {
    stubFetch(ok({ learningLanguage: 'pl' }));
    await useSettingsStore.getState().loadSettings();

    expect(useSettingsStore.getState().settings).toEqual({
      ...defaultSettings,
      learningLanguage: 'pl'
    });
  });

  it('falls back to the defaults when the request is rejected', async () => {
    stubFetch(notOk());
    await useSettingsStore.getState().loadSettings();
    expect(useSettingsStore.getState().settings).toEqual(defaultSettings);
  });

  it('falls back to the defaults and records an error when the request throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await useSettingsStore.getState().loadSettings();

    expect(useSettingsStore.getState().settings).toEqual(defaultSettings);
    expect(useSettingsStore.getState().error).toBe('Failed to load settings');
  });

  it('clears the loading flag either way', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await useSettingsStore.getState().loadSettings();
    expect(useSettingsStore.getState().isLoading).toBe(false);
  });
});

describe('updateSettings', () => {
  beforeEach(() => {
    useSettingsStore.setState({ settings: defaultSettings });
  });

  it('does nothing until settings have been loaded', async () => {
    useSettingsStore.setState({ settings: null });
    const fetchMock = stubFetch(ok({}));
    await useSettingsStore.getState().updateSettings({ theme: 'dark' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts the patch and merges the answer', async () => {
    const fetchMock = stubFetch(ok({ theme: 'dark' }));
    await useSettingsStore.getState().updateSettings({ theme: 'dark' });

    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({ theme: 'dark' });
    expect(useSettingsStore.getState().settings?.theme).toBe('dark');
  });

  it('posts to the settings endpoint as JSON', async () => {
    const fetchMock = stubFetch(ok({}));
    await useSettingsStore.getState().updateSettings({ theme: 'dark' });

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/settings');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  });

  it('clears the loading flag after a failure', async () => {
    stubFetch(notOk());
    await expect(useSettingsStore.getState().updateSettings({ theme: 'dark' })).rejects.toThrow();
    expect(useSettingsStore.getState().isLoading).toBe(false);
  });

  it('throws and records an error when the server rejects it', async () => {
    stubFetch(notOk());
    await expect(useSettingsStore.getState().updateSettings({ theme: 'dark' })).rejects.toThrow(
      /Failed to update settings/
    );
    expect(useSettingsStore.getState().error).toBe('Error updating settings');
  });

  it('keeps the previous settings when the update fails', async () => {
    stubFetch(notOk());
    await expect(useSettingsStore.getState().updateSettings({ theme: 'dark' })).rejects.toThrow();
    expect(useSettingsStore.getState().settings?.theme).toBe('light');
  });
});

describe('updateLearningLanguage', () => {
  beforeEach(() => {
    useSettingsStore.setState({ settings: defaultSettings });
  });

  it('posts only the language', async () => {
    const fetchMock = stubFetch(ok({ learningLanguage: 'pl' }));
    await useSettingsStore.getState().updateLearningLanguage('pl');
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      learningLanguage: 'pl'
    });
  });

  it('announces the change so other components can react', async () => {
    stubFetch(ok({ learningLanguage: 'pl' }));
    await useSettingsStore.getState().updateLearningLanguage('pl');
    expect(dispatchEvent).toHaveBeenCalledOnce();
  });

  it('does not announce a change that failed', async () => {
    stubFetch(notOk());
    await expect(useSettingsStore.getState().updateLearningLanguage('pl')).rejects.toThrow();
    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('reports the failure as a language error, not a settings error', async () => {
    stubFetch(notOk());
    await expect(useSettingsStore.getState().updateLearningLanguage('pl')).rejects.toThrow(
      /Failed to update language/
    );
    expect(useSettingsStore.getState().error).toBe('Error updating language');
  });
});

describe('loadTopics', () => {
  it('stores the topics it received', async () => {
    stubFetch(ok({ success: true, topics: { Tenses: { a: 'Past Simple' } } }));
    await useSettingsStore.getState().loadTopics('pl');

    expect(useSettingsStore.getState().topics).toEqual({ Tenses: { a: 'Past Simple' } });
    expect(useSettingsStore.getState().isLoadingTopics).toBe(false);
  });

  it('asks for the topics of the requested language', async () => {
    const fetchMock = stubFetch(ok({ success: true, topics: {} }));
    await useSettingsStore.getState().loadTopics('pl');
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('language=pl');
  });

  it('records an error when the payload is unsuccessful', async () => {
    stubFetch(ok({ success: false }));
    await useSettingsStore.getState().loadTopics('pl');

    expect(useSettingsStore.getState().error).toBe('Failed to load topics');
    expect(useSettingsStore.getState().topics).toBeNull();
  });

  it('records an error when the request throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await useSettingsStore.getState().loadTopics('pl');

    expect(useSettingsStore.getState().error).toBe('Failed to load topics');
    expect(useSettingsStore.getState().isLoadingTopics).toBe(false);
  });
});

describe('setSettings', () => {
  it('replaces the settings outright', () => {
    useSettingsStore.getState().setSettings({ ...defaultSettings, theme: 'dark' });
    expect(useSettingsStore.getState().settings?.theme).toBe('dark');
  });
});
