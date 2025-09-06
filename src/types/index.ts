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
