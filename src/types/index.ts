export interface Exercise {
  sentence: string;
  correctAnswers: string[];
}

export interface ExerciseBlock {
  id: string;
  exercises: Exercise[];
  createdAt: Date;
  isChecking: boolean;
}

export type AppState = 'loading-topics' | 'topic-selection' | 'loading-exercises' | 'exercises' | 'checking';

export interface ValidationResult {
  isCorrect: boolean;
  error?: string;
}

export interface ValidationResults {
  [key: string]: { [key: string]: ValidationResult };
}

export interface DictionaryWord {
  id: string;
  word: string;
  translate: string;
  createdAt: Date;
}

export interface DictionaryState {
  words: DictionaryWord[];
}

export interface AppStore {
  state: AppState;
  selectedTopic: string;
  exerciseBlocks: ExerciseBlock[];
  error: string;
  validationResults: ValidationResults;
  handleTopicSelect: (topic: string, mode?: 'learn' | 'train', level?: string, selectedWords?: string[]) => Promise<void>;
  generateMoreExercises: (mode?: 'learn' | 'train', level?: string, selectedWords?: string[]) => Promise<void>;
  handleCheckAnswers: (blockId: string, userAnswers: { [key: string]: string }) => Promise<void>;
  clearError: () => void;
}

export interface DictionaryStore extends DictionaryState {
  isInitialized: boolean;
  initializeDB: () => Promise<void>;
  addWord: (word: string, translate: string) => Promise<void>;
  removeWord: (id: string) => Promise<void>;
  updateWord: (id: string, word: string, translate: string) => Promise<void>;
  loadWords: () => Promise<void>;
  clearFilters: () => void;
  getFilteredWords: (searchQuery?: string) => DictionaryWord[];
}
