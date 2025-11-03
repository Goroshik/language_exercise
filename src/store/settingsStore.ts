import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface UserSettings {
  theme: string;
  aiModel: string;
  language: string;
  translationLang: string;
  learningLanguage: string;
  lastSelectedTopic?: string;
  customSettings?: Record<string, any>;
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

const defaultSettings: UserSettings = {
  theme: 'light',
  aiModel: 'gemini-2.5-flash',
  language: 'en',
  translationLang: 'RU',
  learningLanguage: 'en'
};

export const useSettingsStore = create<SettingsStore>()(
  devtools((set, get) => ({
    settings: null,
    isLoading: false,
    error: null,
    topics: null,
    isLoadingTopics: false,

    loadSettings: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const settings = await response.json();
          set({ settings: { ...defaultSettings, ...settings }, isLoading: false });
        } else {
          set({ settings: defaultSettings, isLoading: false });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        set({ 
          settings: defaultSettings, 
          isLoading: false, 
          error: 'Failed to load settings' 
        });
      }
    },

    updateLearningLanguage: async (language: string) => {
      const currentSettings = get().settings;
      if (!currentSettings) return;

      set({ isLoading: true, error: null });
      try {
        const response = await fetch('/api/settings', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ learningLanguage: language })
        });

        if (response.ok) {
          const updatedSettings = await response.json();
          set({ 
            settings: { ...currentSettings, ...updatedSettings }, 
            isLoading: false 
          });
          
          // Dispatch event for other components
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('learningLanguageChanged'));
          }
        } else {
          set({ isLoading: false, error: 'Failed to update language' });
          throw new Error('Failed to update language');
        }
      } catch (error) {
        console.error('Error updating language:', error);
        set({ isLoading: false, error: 'Error updating language' });
        throw error;
      }
    },

    updateSettings: async (updates: Partial<UserSettings>) => {
      const currentSettings = get().settings;
      if (!currentSettings) return;

      set({ isLoading: true, error: null });
      try {
        const response = await fetch('/api/settings', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updates)
        });

        if (response.ok) {
          const updatedSettings = await response.json();
          set({ 
            settings: { ...currentSettings, ...updatedSettings }, 
            isLoading: false 
          });
        } else {
          set({ isLoading: false, error: 'Failed to update settings' });
          throw new Error('Failed to update settings');
        }
      } catch (error) {
        console.error('Error updating settings:', error);
        set({ isLoading: false, error: 'Error updating settings' });
        throw error;
      }
    },

    setSettings: (settings: UserSettings) => {
      set({ settings });
    },

    loadTopics: async (language: string) => {
      set({ isLoadingTopics: true, error: null });
      try {
        const response = await fetch(`/api/topics?language=${language}`);
        const data = await response.json();
        if (data.success) {
          set({ topics: data.topics, isLoadingTopics: false });
        } else {
          set({ isLoadingTopics: false, error: 'Failed to load topics' });
        }
      } catch (error) {
        console.error('Failed to load topics:', error);
        set({ 
          isLoadingTopics: false, 
          error: 'Failed to load topics' 
        });
      }
    }
  }))
);
