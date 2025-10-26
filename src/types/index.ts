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

export type AppState =
  | 'loading-topics'
  | 'topics-loaded'
  | 'topic-selection'
  | 'loading-exercises'
  | 'exercises'
  | 'checking';

export interface ValidationResult {
  isCorrect: boolean;
  error?: string;
  incorrectTranslations?: string[];
}

export interface ValidationResults {
  [key: string]: { [key: string]: ValidationResult };
}

// Standardized result item returned by the check-answers API
export interface CheckAnswerItem {
  // True if grammar and translation are correct
  isCorrect: boolean;
  // Optional, present when grammar is wrong
  grammarError?: string;
  // Optional list of translation mistakes (free-form strings)
  translationErrors?: string[];
  // Indicates that the original sentence was skipped (empty input)
  skipped?: boolean;
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
  selectedLanguageId?: string;
  exerciseBlocks: ExerciseBlock[];
  error: string;
  validationResults: ValidationResults;
  isNavigating: boolean;
  setIsNavigating: (isNavigating: boolean) => void;
  setState: (state: AppState) => void;
  lastSelectedTopicPath: string;
  loadLastSelectedTopic: () => Promise<string>;
  handleTopicSelect: (data: {
    languageId?: string;
    level?: string;
    selectedWords?: DictionaryWord[];
    mode?: 'student' | 'teacher';
  }) => Promise<void>;
  generateMoreExercises: (data: {
    languageId?: string;
    level?: string;
    selectedWords?: DictionaryWord[];
    mode?: 'student' | 'teacher';
  }) => Promise<void>;
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
