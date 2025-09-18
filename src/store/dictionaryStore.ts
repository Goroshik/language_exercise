import {create} from 'zustand';
import {DictionaryState, DictionaryWord} from '../types';
import dictionaryData from '../constants/dictionary_eng';
import {indexedDBService, TagItem} from '../services/indexedDBService';

interface DictionaryStore extends DictionaryState {
  // State
  isInitialized: boolean;

  // Actions
  initializeDB: () => Promise<void>;
  addWord: (word: string, translate: string, tags: string[]) => Promise<void>;
  removeWord: (id: string) => Promise<void>;
  updateWord: (id: string, word: string, translate: string, tags: string[]) => Promise<void>;
  loadWords: () => Promise<void>;
  setSelectedTags: (tags: string[]) => void;
  clearFilters: () => void;
  getFilteredWords: (searchQuery?: string) => DictionaryWord[];
  getAllTags: () => Promise<string[]>;
  saveTags: (tags: string[]) => Promise<void>;
  loadAllTags: () => Promise<void>;
}

// Преобразуем существующие слова в новый формат для миграции
const getInitialWords = (): DictionaryWord[] => dictionaryData.map((item, index) => ({
  id: `default_${index}`,
  word: item.word,
  translate: item.translate,
  tags: ['default'], // Все существующие слова помечаем тегом 'default'
  createdAt: new Date(),
  isUserAdded: false
}));

export const useDictionaryStore = create<DictionaryStore>((set, get) => ({
  // Initial state
  words: [],
  selectedTags: [],
  isInitialized: false,
  allTags: [],

  // Actions
  initializeDB: async () => {
    try {
      await indexedDBService.init();

      // Проверяем есть ли уже данные в IndexedDB
      const existingWords = await indexedDBService.getAllWords();

      if (existingWords.length === 0) {
        // Если данных нет, импортируем начальные данные
        const initialWords = getInitialWords();
        await indexedDBService.importWords(initialWords);
      }

      // Загружаем слова из IndexedDB
      await get().loadWords();

      // Загружаем все теги
      await get().loadAllTags();

      set({isInitialized: true});
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      // Fallback to initial data in memory
      set({
        words: getInitialWords(),
        isInitialized: true
      });
    }
  },

  loadWords: async () => {
    try {
      const words = await indexedDBService.getAllWords();
      set({words});
    } catch (error) {
      console.error('Failed to load words:', error);
    }
  },

  addWord: async (word: string, translate: string, tags: string[]) => {
    const newWord: DictionaryWord = {
      id: `user_${Date.now()}`,
      word: word.trim(),
      translate: translate.trim(),
      tags: tags.filter(tag => tag.trim()),
      createdAt: new Date(),
      isUserAdded: true
    };

    try {
      // Save tags as TagItem entities
      await get().saveTags(newWord.tags);

      await indexedDBService.addWord(newWord);
      set(state => ({
        words: [...state.words, newWord]
      }));
      // Reload all tags to keep store in sync
      await get().loadAllTags();
    } catch (error) {
      console.error('Failed to add word:', error);
      throw error;
    }
  },

  removeWord: async (id: string) => {
    try {
      await indexedDBService.deleteWord(id);
      set(state => ({
        words: state.words.filter(word => word.id !== id)
      }));
    } catch (error) {
      console.error('Failed to remove word:', error);
      throw error;
    }
  },

  updateWord: async (id: string, word: string, translate: string, tags: string[]) => {
    const updatedWord: DictionaryWord = {
      id,
      word: word.trim(),
      translate: translate.trim(),
      tags: tags.filter(tag => tag.trim()),
      createdAt: new Date(), // This should ideally preserve original createdAt
      isUserAdded: true
    };

    try {
      // Get original word to preserve createdAt and isUserAdded
      const originalWord = get().words.find(w => w.id === id);
      if (originalWord) {
        updatedWord.createdAt = originalWord.createdAt;
        updatedWord.isUserAdded = originalWord.isUserAdded;
      }

      // Save tags as TagItem entities
      await get().saveTags(updatedWord.tags);

      await indexedDBService.updateWord(updatedWord);
      set(state => ({
        words: state.words.map(w => w.id === id ? updatedWord : w)
      }));
      // Reload all tags to keep store in sync
      await get().loadAllTags();
    } catch (error) {
      console.error('Failed to update word:', error);
      throw error;
    }
  },

  setSelectedTags: (tags: string[]) => {
    set({selectedTags: tags});
  },

  clearFilters: () => {
    set({selectedTags: []});
  },

  getFilteredWords: (searchQuery: string = '') => {
    const {words, selectedTags} = get();

    return words.filter(word => {
      // NOTE: Filter by tags
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.some(tag => word.tags.includes(tag));

      // NOTE: Filter by search query
      const matchesSearch = searchQuery === '' ||
        word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        word.translate.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTags && matchesSearch;
    });
  },

  getAllTags: async () => {
    try {
      const tagItems = await indexedDBService.getAllTags();
      return tagItems.map(tagItem => tagItem.name).sort();
    } catch (error) {
      console.error('Failed to get tags from database:', error);
      // Fallback to extracting from words if database fails
      const {words} = get();
      const allTags = new Set<string>();
      words.forEach(word => {
        word.tags.forEach(tag => allTags.add(tag));
      });
      return Array.from(allTags).sort();
    }
  },

  saveTags: async (tags: string[]) => {
    try {
      const existingTags = await indexedDBService.getAllTags();
      const existingTagNames = existingTags.map(tag => tag.name);

      for (const tagName of tags) {
        if (!existingTagNames.includes(tagName)) {
          const newTag: TagItem = {
            id: `tag_${Date.now()}_${Math.random()}`,
            name: tagName,
            createdAt: new Date()
          };
          await indexedDBService.addTag(newTag);
        }
      }
      // Reload all tags after saving new ones
      await get().loadAllTags();
    } catch (error) {
      console.error('Failed to save tags:', error);
    }
  },

  loadAllTags: async () => {
    try {
      const tagItems = await indexedDBService.getAllTags();
      const tags = tagItems.map(tagItem => tagItem.name).sort();
      set({allTags: tags});
    } catch (error) {
      console.error('Failed to load tags:', error);
      // Fallback to extracting from words if database fails
      const {words} = get();
      const allTags = new Set<string>();
      words.forEach(word => {
        word.tags.forEach(tag => allTags.add(tag));
      });
      set({allTags: Array.from(allTags).sort()});
    }
  }
}));

