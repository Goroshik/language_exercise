/**
 * Pure helpers behind the exercise store.
 *
 * The three loaders in appStore (fresh topic, more exercises, training from
 * history) all shape the same API response into the same block, so the shaping
 * lives here where it can be tested without a store.
 */
import type { CheckAnswerItem, Exercise, ExerciseBlock, ValidationResult } from 'src/types';

export const UNKNOWN_ERROR = 'Неизвестная ошибка';

/** "/exercises/past_simple" -> "past simple" */
export function topicFromPathname(pathname: string): string {
  const raw = pathname.split('/').pop() || '';
  return raw.replace(/_/g, ' ');
}

/** Prefixes a failure reason, falling back when the throw was not an Error. */
export function describeError(err: unknown, prefix: string): string {
  const reason = err instanceof Error ? err.message : UNKNOWN_ERROR;
  return `${prefix}: ${reason}`;
}

/**
 * Pairs each generated sentence with its history id and whether the learner
 * already answered it. Student and teacher mode produce the same shape - the
 * two branches this replaced were identical.
 */
export function buildExercises(
  sentences: string[],
  sentenceIds: string[],
  hasAnswers: Record<string, boolean>
): Exercise[] {
  return sentences.map((sentence, index) => {
    const sentenceId = sentenceIds[index] || undefined;
    return {
      sentence: sentence.trim(),
      correctAnswers: [],
      sentenceId,
      hasAnswer: sentenceId ? hasAnswers[sentenceId] || false : false
    };
  });
}

export interface ExerciseResponse {
  data?: string[] | undefined;
  sentenceIds?: string[] | undefined;
  hasAnswers?: Record<string, boolean> | undefined;
}

/** Absorbs the optional fields of an exercise response in one place. */
export function exercisesFromResponse(response: ExerciseResponse): {
  exercises: Exercise[];
  sentenceIds: string[];
} {
  const { data = [], sentenceIds = [], hasAnswers = {} } = response;
  return { exercises: buildExercises(data, sentenceIds, hasAnswers), sentenceIds };
}

export function createExerciseBlock(exercises: Exercise[], now: Date): ExerciseBlock {
  return {
    id: `block_${now.getTime()}`,
    exercises,
    createdAt: now,
    isChecking: false
  };
}

/** Every sentence id currently on the page, so history can skip them. */
export function collectSentenceIds(blocks: ExerciseBlock[]): string[] {
  return blocks
    .flatMap(block => block.exercises)
    .map(exercise => exercise.sentenceId)
    .filter((id): id is string => id !== undefined);
}

/** The textarea key a given exercise's answer is stored under. */
export function textareaId(blockId: string, index: number): string {
  return `textarea_${blockId}_${index}`;
}

/**
 * Answers to submit for checking. Exercises with no history id fall back to a
 * positional id so the AI can still echo something back.
 */
export function buildAnswerPayload(
  blockId: string,
  exercises: Exercise[],
  userAnswers: Record<string, string>
): Array<{ id: string; sentence: string }> {
  return exercises.map((exercise, index) => ({
    id: exercise.sentenceId || `${blockId}_${index}`,
    sentence: userAnswers[textareaId(blockId, index)] || ''
  }));
}

/** Keys the verdicts by textarea id; skipped exercises get no entry. */
export function buildValidationResults(
  blockId: string,
  items: CheckAnswerItem[]
): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {};

  items.forEach((item, index) => {
    if (item.skipped) return;

    results[textareaId(blockId, index)] = {
      isCorrect: Boolean(item.isCorrect),
      error: item.grammarError,
      incorrectTranslations: item.translationErrors
    };
  });

  return results;
}

export function answersToMap(
  answers: Array<{ sentenceId: string; answer: string }>
): Record<string, string> {
  const map: Record<string, string> = {};
  answers.forEach(answer => {
    map[answer.sentenceId] = answer.answer;
  });
  return map;
}

/** Flips isChecking on one block, leaving the rest untouched. */
export function markBlockChecking(
  blocks: ExerciseBlock[],
  blockId: string,
  isChecking: boolean
): ExerciseBlock[] {
  return blocks.map(block => (block.id === blockId ? { ...block, isChecking } : block));
}
