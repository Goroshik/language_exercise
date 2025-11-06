import { create } from 'zustand';

export interface EssayError {
  text: string;
  explanation: string;
  color: string;
  type: string;
}

export interface EssayCheckResponse {
  level: string;
  errors: EssayError[];
  summary: string;
}

export interface Essay {
  id: string;
  title: string;
  content: string;
  aiResponse: string | null;
  languageCode: string;
  level: string | null;
  updatedAt: string;
}

interface EssayState {
  // Data
  essays: Essay[];
  currentEssayId: string | null;
  title: string;
  content: string;
  aiResponse: EssayCheckResponse | null;
  defaultTopics: string[];

  // UI State
  loading: boolean;
  saving: boolean;
  hoveredErrorIndex: number | null;
  selectedErrorIndex: number | null;

  // Actions
  setEssays: (essays: Essay[]) => void;
  setCurrentEssayId: (id: string | null) => void;
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  setAiResponse: (response: EssayCheckResponse | null) => void;
  setDefaultTopics: (topics: string[]) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setHoveredErrorIndex: (index: number | null) => void;
  setSelectedErrorIndex: (index: number | null) => void;

  // Complex actions
  loadEssayByTitle: (title: string) => void;
  clearEssay: () => void;
  reset: () => void;
}

const initialState = {
  essays: [],
  currentEssayId: null,
  title: '',
  content: '',
  aiResponse: null,
  defaultTopics: [],
  loading: false,
  saving: false,
  hoveredErrorIndex: null,
  selectedErrorIndex: null
};

export const useEssayStore = create<EssayState>((set, get) => ({
  ...initialState,

  setEssays: (essays) => set({ essays }),
  setCurrentEssayId: (id) => set({ currentEssayId: id }),
  setTitle: (title) => set({ title }),
  setContent: (content) => set({ content }),
  setAiResponse: (response) => set({ aiResponse: response }),
  setDefaultTopics: (topics) => set({ defaultTopics: topics }),
  setLoading: (loading) => set({ loading }),
  setSaving: (saving) => set({ saving }),
  setHoveredErrorIndex: (index) => set({ hoveredErrorIndex: index }),
  setSelectedErrorIndex: (index) => set({ selectedErrorIndex: index }),

  loadEssayByTitle: (selectedTitle: string) => {
    const { essays } = get();
    const essay = essays.find((e) => e.title === selectedTitle);

    if (essay) {
      let parsedResponse = null;
      if (essay.aiResponse) {
        try {
          parsedResponse = JSON.parse(essay.aiResponse);
        } catch {
          parsedResponse = null;
        }
      }

      set({
        currentEssayId: essay.id,
        title: essay.title,
        content: essay.content,
        aiResponse: parsedResponse,
        selectedErrorIndex: null
      });
    }
  },

  clearEssay: () =>
    set({
      content: '',
      aiResponse: null,
      selectedErrorIndex: null
    }),

  reset: () => set(initialState)
}));
