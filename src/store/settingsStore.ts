import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const SETTINGS_ENDPOINT = '/api/settings';

export interface UserSettings {
  theme: string;
  aiModel: string;
  language: string;
  translationLang: string;
  learningLanguage: string;
  lastSelectedTopic?: string;
  lastSelectedLevel?: string;
}

interface SettingsStore {
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
  topics: Record<string, Record<string, string>> | null;
  isLoadingTopics: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  updateLearningLanguage: (language: string) => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  setSettings: (settings: UserSettings) => void;
  loadTopics: (language: string) => Promise<void>;
}

type Set = (partial: Partial<SettingsStore>) => void;
type Get = () => SettingsStore;

export const defaultSettings: UserSettings = {
  theme: 'light',
  aiModel: 'gemini-2.5-flash',
  language: 'en',
  translationLang: 'RU',
  learningLanguage: 'en'
};

const loadSettings = (set: Set) => async () => {
  set({ isLoading: true, error: null });

  try {
    const response = await fetch(SETTINGS_ENDPOINT);
    const settings = response.ok ? await response.json() : {};
    set({ settings: { ...defaultSettings, ...settings }, isLoading: false });
  } catch (error) {
    console.error('Failed to load settings:', error);
    set({ settings: defaultSettings, isLoading: false, error: 'Failed to load settings' });
  }
};

/**
 * Persists a settings patch and merges the server's answer back in.
 * `label` names the operation in the two error messages it can produce.
 */
async function persistSettings(
  set: Set,
  get: Get,
  updates: Partial<UserSettings>,
  label: string
): Promise<void> {
  const currentSettings = get().settings;
  if (!currentSettings) return;

  set({ isLoading: true, error: null });

  try {
    const response = await fetch(SETTINGS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      set({ isLoading: false, error: `Failed to update ${label}` });
      throw new Error(`Failed to update ${label}`);
    }

    const updated = await response.json();
    set({ settings: { ...currentSettings, ...updated }, isLoading: false });
  } catch (error) {
    console.error(`Error updating ${label}:`, error);
    set({ isLoading: false, error: `Error updating ${label}` });
    throw error;
  }
}

const updateLearningLanguage = (set: Set, get: Get) => async (language: string) => {
  await persistSettings(set, get, { learningLanguage: language }, 'language');

  // Other components listen for this to reload language-scoped data.
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('learningLanguageChanged'));
  }
};

const updateSettings = (set: Set, get: Get) => async (updates: Partial<UserSettings>) => {
  await persistSettings(set, get, updates, 'settings');
};

const loadTopics = (set: Set) => async (language: string) => {
  set({ isLoadingTopics: true, error: null });

  try {
    const response = await fetch(`/api/topics?language=${language}`);
    const data = await response.json();

    if (!data.success) {
      set({ isLoadingTopics: false, error: 'Failed to load topics' });
      return;
    }
    set({ topics: data.topics, isLoadingTopics: false });
  } catch (error) {
    console.error('Failed to load topics:', error);
    set({ isLoadingTopics: false, error: 'Failed to load topics' });
  }
};

export const useSettingsStore = create<SettingsStore>()(
  devtools((set, get) => ({
    settings: null,
    isLoading: false,
    error: null,
    topics: null,
    isLoadingTopics: false,

    setSettings: (settings: UserSettings) => set({ settings }),
    loadSettings: loadSettings(set),
    updateLearningLanguage: updateLearningLanguage(set, get),
    updateSettings: updateSettings(set, get),
    loadTopics: loadTopics(set)
  }))
);
