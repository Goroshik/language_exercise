import { DictionaryWord } from '../types';

// IndexedDB database configuration
const DB_NAME = 'EnglishLearningDB';
const DB_VERSION = 1;
const WORDS_STORE = 'words';
const TAGS_STORE = 'tags';

export interface TagItem {
  id: string;
  name: string;
  createdAt: Date;
  color?: string;
}

class IndexedDBService {
  private db: IDBDatabase | null = null;

  // Initialize IndexedDB connection
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create words object store
        if (!db.objectStoreNames.contains(WORDS_STORE)) {
          const wordsStore = db.createObjectStore(WORDS_STORE, { keyPath: 'id' });
          wordsStore.createIndex('word', 'word', { unique: false });
          wordsStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
          wordsStore.createIndex('isUserAdded', 'isUserAdded', { unique: false });
        }

        // Create tags object store
        if (!db.objectStoreNames.contains(TAGS_STORE)) {
          const tagsStore = db.createObjectStore(TAGS_STORE, { keyPath: 'id' });
          tagsStore.createIndex('name', 'name', { unique: true });
        }
      };
    });
  }

  // Words CRUD operations
  async addWord(word: DictionaryWord): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([WORDS_STORE], 'readwrite');
    const store = transaction.objectStore(WORDS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.add(word);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateWord(word: DictionaryWord): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([WORDS_STORE], 'readwrite');
    const store = transaction.objectStore(WORDS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.put(word);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteWord(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([WORDS_STORE], 'readwrite');
    const store = transaction.objectStore(WORDS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getWord(id: string): Promise<DictionaryWord | undefined> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([WORDS_STORE], 'readonly');
    const store = transaction.objectStore(WORDS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllWords(): Promise<DictionaryWord[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([WORDS_STORE], 'readonly');
    const store = transaction.objectStore(WORDS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getWordsByTag(tagName: string): Promise<DictionaryWord[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([WORDS_STORE], 'readonly');
    const store = transaction.objectStore(WORDS_STORE);
    const index = store.index('tags');

    return new Promise((resolve, reject) => {
      const request = index.getAll(tagName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Tags CRUD operations
  async addTag(tag: TagItem): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([TAGS_STORE], 'readwrite');
    const store = transaction.objectStore(TAGS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.add(tag);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateTag(tag: TagItem): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([TAGS_STORE], 'readwrite');
    const store = transaction.objectStore(TAGS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.put(tag);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteTag(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([TAGS_STORE], 'readwrite');
    const store = transaction.objectStore(TAGS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllTags(): Promise<TagItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([TAGS_STORE], 'readonly');
    const store = transaction.objectStore(TAGS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([WORDS_STORE, TAGS_STORE], 'readwrite');
    const wordsStore = transaction.objectStore(WORDS_STORE);
    const tagsStore = transaction.objectStore(TAGS_STORE);

    return new Promise((resolve, reject) => {
      const clearWords = wordsStore.clear();
      const clearTags = tagsStore.clear();

      let completed = 0;
      const onComplete = () => {
        completed++;
        if (completed === 2) resolve();
      };

      clearWords.onsuccess = onComplete;
      clearTags.onsuccess = onComplete;
      clearWords.onerror = clearTags.onerror = () => reject();
    });
  }

  async getUniqueTagsFromWords(): Promise<string[]> {
    const words = await this.getAllWords();
    const tagsSet = new Set<string>();

    words.forEach(word => {
      word.tags.forEach(tag => tagsSet.add(tag));
    });

    return Array.from(tagsSet).sort();
  }

  async searchWords(query: string = '', selectedTags: string[] = []): Promise<DictionaryWord[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([WORDS_STORE], 'readonly');
    const store = transaction.objectStore(WORDS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        const words = request.result;

        const filteredWords = words.filter(word => {
          // Filter by tags
          const matchesTags = selectedTags.length === 0 ||
            selectedTags.some(tag => word.tags.includes(tag));

          // Filter by search query (partial match)
          const matchesSearch = query === '' ||
            word.word.toLowerCase().includes(query.toLowerCase()) ||
            word.translate.toLowerCase().includes(query.toLowerCase());

          return matchesTags && matchesSearch;
        });

        resolve(filteredWords);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Migration helper - import existing data
  async importWords(words: DictionaryWord[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([WORDS_STORE], 'readwrite');
    const store = transaction.objectStore(WORDS_STORE);

    return new Promise((resolve, reject) => {
      let completed = 0;
      const total = words.length;

      if (total === 0) {
        resolve();
        return;
      }

      words.forEach(word => {
        const request = store.put(word);
        request.onsuccess = () => {
          completed++;
          if (completed === total) resolve();
        };
        request.onerror = () => reject(request.error);
      });
    });
  }
}

// Singleton instance
export const indexedDBService = new IndexedDBService();
