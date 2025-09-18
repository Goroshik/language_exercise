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
  tags: string[];
  createdAt: Date;
  isUserAdded: boolean;
}

export interface DictionaryState {
  words: DictionaryWord[];
  selectedTags: string[];
  allTags: string[];
}
