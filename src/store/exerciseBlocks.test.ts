import { describe, expect, it } from 'vitest';
import type { CheckAnswerItem, Exercise, ExerciseBlock } from 'src/types';
import {
  answersToMap,
  buildAnswerPayload,
  buildExercises,
  buildValidationResults,
  collectSentenceIds,
  createExerciseBlock,
  describeError,
  exercisesFromResponse,
  markBlockChecking,
  textareaId,
  topicFromPathname
} from './exerciseBlocks';

const exercise = (sentence: string, sentenceId?: string): Exercise => ({
  sentence,
  correctAnswers: [],
  sentenceId,
  hasAnswer: false
});

const block = (id: string, exercises: Exercise[]): ExerciseBlock => ({
  id,
  exercises,
  createdAt: new Date(0),
  isChecking: false
});

describe('topicFromPathname', () => {
  it('takes the last segment and unslugifies it', () => {
    expect(topicFromPathname('/exercises/past_simple')).toBe('past simple');
  });

  it('handles a multi-word topic', () => {
    expect(topicFromPathname('/exercises/present_perfect_continuous')).toBe(
      'present perfect continuous'
    );
  });

  it('leaves a single-word topic alone', () => {
    expect(topicFromPathname('/exercises/articles')).toBe('articles');
  });

  it('returns an empty string for a trailing slash', () => {
    expect(topicFromPathname('/exercises/')).toBe('');
  });

  it('returns an empty string for an empty path', () => {
    expect(topicFromPathname('')).toBe('');
  });
});

describe('describeError', () => {
  it('appends the message of an Error', () => {
    expect(describeError(new Error('timeout'), 'Ошибка')).toBe('Ошибка: timeout');
  });

  it('falls back for a non-Error throw', () => {
    expect(describeError('kaboom', 'Ошибка')).toBe('Ошибка: Неизвестная ошибка');
  });

  it('falls back for undefined', () => {
    expect(describeError(undefined, 'Ошибка')).toContain('Неизвестная ошибка');
  });

  it('keeps the prefix verbatim, separated by a colon', () => {
    expect(describeError(new Error('x'), 'Prefix here')).toBe('Prefix here: x');
  });
});

describe('buildExercises', () => {
  it('trims each sentence', () => {
    expect(buildExercises(['  Ona czyta.  '], [], {})[0]?.sentence).toBe('Ona czyta.');
  });

  it('pairs sentences with their history ids by position', () => {
    const exercises = buildExercises(['a', 'b'], ['s1', 's2'], {});
    expect(exercises.map(e => e.sentenceId)).toEqual(['s1', 's2']);
  });

  it('leaves the id undefined when history has none', () => {
    expect(buildExercises(['a'], [], {})[0]?.sentenceId).toBeUndefined();
  });

  it('treats an empty id as no id', () => {
    expect(buildExercises(['a'], [''], {})[0]?.sentenceId).toBeUndefined();
  });

  it('marks an exercise the learner already answered', () => {
    expect(buildExercises(['a'], ['s1'], { s1: true })[0]?.hasAnswer).toBe(true);
  });

  it('marks an unanswered exercise', () => {
    expect(buildExercises(['a'], ['s1'], { s1: false })[0]?.hasAnswer).toBe(false);
  });

  it('defaults hasAnswer to false when the map says nothing', () => {
    expect(buildExercises(['a'], ['s1'], {})[0]?.hasAnswer).toBe(false);
  });

  it('cannot have an answer without an id', () => {
    expect(buildExercises(['a'], [], { s1: true })[0]?.hasAnswer).toBe(false);
  });

  it('starts with no correct answers', () => {
    expect(buildExercises(['a'], [], {})[0]?.correctAnswers).toEqual([]);
  });

  it('produces one exercise per sentence', () => {
    expect(buildExercises(['a', 'b', 'c'], [], {})).toHaveLength(3);
  });

  it('returns nothing for no sentences', () => {
    expect(buildExercises([], ['s1'], {})).toEqual([]);
  });
});

describe('exercisesFromResponse', () => {
  it('reads the sentences and ids out of a full response', () => {
    const result = exercisesFromResponse({
      data: ['a'],
      sentenceIds: ['s1'],
      hasAnswers: { s1: true }
    });
    expect(result.sentenceIds).toEqual(['s1']);
    expect(result.exercises[0]).toMatchObject({ sentenceId: 's1', hasAnswer: true });
  });

  it('copes with an entirely empty response', () => {
    expect(exercisesFromResponse({})).toEqual({ exercises: [], sentenceIds: [] });
  });

  it('copes with sentences but no ids', () => {
    const result = exercisesFromResponse({ data: ['a'] });
    expect(result.exercises).toHaveLength(1);
    expect(result.sentenceIds).toEqual([]);
  });
});

describe('createExerciseBlock', () => {
  it('derives the id from the timestamp', () => {
    expect(createExerciseBlock([], new Date(1700000000000)).id).toBe('block_1700000000000');
  });

  it('keeps the exercises it was given', () => {
    const exercises = [exercise('a')];
    expect(createExerciseBlock(exercises, new Date(0)).exercises).toBe(exercises);
  });

  it('records the creation time', () => {
    const now = new Date(1700000000000);
    expect(createExerciseBlock([], now).createdAt).toBe(now);
  });

  it('starts not checking', () => {
    expect(createExerciseBlock([], new Date(0)).isChecking).toBe(false);
  });
});

describe('collectSentenceIds', () => {
  it('gathers ids across every block', () => {
    const blocks = [
      block('b1', [exercise('a', 's1')]),
      block('b2', [exercise('b', 's2'), exercise('c', 's3')])
    ];
    expect(collectSentenceIds(blocks)).toEqual(['s1', 's2', 's3']);
  });

  it('skips exercises with no id', () => {
    expect(collectSentenceIds([block('b1', [exercise('a'), exercise('b', 's2')])])).toEqual(['s2']);
  });

  it('returns nothing for no blocks', () => {
    expect(collectSentenceIds([])).toEqual([]);
  });

  it('returns nothing for a block with no exercises', () => {
    expect(collectSentenceIds([block('b1', [])])).toEqual([]);
  });
});

describe('textareaId', () => {
  it('combines the block id and index', () => {
    expect(textareaId('b1', 2)).toBe('textarea_b1_2');
  });
});

describe('buildAnswerPayload', () => {
  it('uses the history id when the exercise has one', () => {
    const payload = buildAnswerPayload('b1', [exercise('a', 's1')], {});
    expect(payload[0]?.id).toBe('s1');
  });

  it('falls back to a positional id', () => {
    const payload = buildAnswerPayload('b1', [exercise('a')], {});
    expect(payload[0]?.id).toBe('b1_0');
  });

  it('picks up the answer the learner typed', () => {
    const payload = buildAnswerPayload('b1', [exercise('a', 's1')], { textarea_b1_0: 'Ona czyta' });
    expect(payload[0]?.sentence).toBe('Ona czyta');
  });

  it('sends an empty string for an untouched exercise', () => {
    expect(buildAnswerPayload('b1', [exercise('a', 's1')], {})[0]?.sentence).toBe('');
  });

  it('keeps one entry per exercise, in order', () => {
    const payload = buildAnswerPayload('b1', [exercise('a', 's1'), exercise('b')], {
      textarea_b1_1: 'second'
    });
    expect(payload).toEqual([
      { id: 's1', sentence: '' },
      { id: 'b1_1', sentence: 'second' }
    ]);
  });
});

describe('buildValidationResults', () => {
  const items = (...values: CheckAnswerItem[]) => values;

  it('keys verdicts by textarea id', () => {
    const results = buildValidationResults('b1', items({ isCorrect: true }));
    expect(results).toEqual({ textarea_b1_0: { isCorrect: true } });
  });

  it('carries the grammar error through', () => {
    const results = buildValidationResults('b1', items({ isCorrect: false, grammarError: 'case' }));
    expect(results.textarea_b1_0).toMatchObject({ isCorrect: false, error: 'case' });
  });

  it('carries the translation errors through', () => {
    const results = buildValidationResults(
      'b1',
      items({ isCorrect: false, translationErrors: ['a - б'] })
    );
    expect(results.textarea_b1_0).toMatchObject({ incorrectTranslations: ['a - б'] });
  });

  it('omits a skipped exercise entirely', () => {
    const results = buildValidationResults('b1', items({ isCorrect: true, skipped: true }));
    expect(results).toEqual({});
  });

  it('keeps the index of skipped exercises so later ones do not shift', () => {
    const results = buildValidationResults(
      'b1',
      items({ isCorrect: true, skipped: true }, { isCorrect: false })
    );
    expect(Object.keys(results)).toEqual(['textarea_b1_1']);
  });

  it('coerces a truthy isCorrect to a boolean', () => {
    const results = buildValidationResults('b1', items({ isCorrect: 1 as unknown as boolean }));
    expect(results.textarea_b1_0?.isCorrect).toBe(true);
  });

  it('returns nothing for no items', () => {
    expect(buildValidationResults('b1', [])).toEqual({});
  });
});

describe('answersToMap', () => {
  it('keys answers by sentence id', () => {
    expect(answersToMap([{ sentenceId: 's1', answer: 'Ona czyta' }])).toEqual({
      s1: 'Ona czyta'
    });
  });

  it('keeps the last answer when an id repeats', () => {
    expect(
      answersToMap([
        { sentenceId: 's1', answer: 'first' },
        { sentenceId: 's1', answer: 'second' }
      ])
    ).toEqual({ s1: 'second' });
  });

  it('returns an empty map for no answers', () => {
    expect(answersToMap([])).toEqual({});
  });
});

describe('markBlockChecking', () => {
  const blocks = [block('b1', []), block('b2', [])];

  it('flips the flag on the named block', () => {
    expect(markBlockChecking(blocks, 'b1', true)[0]?.isChecking).toBe(true);
  });

  it('leaves the other blocks alone', () => {
    const result = markBlockChecking(blocks, 'b1', true);
    expect(result[1]).toBe(blocks[1]);
  });

  it('clears the flag again', () => {
    const checking = markBlockChecking(blocks, 'b1', true);
    expect(markBlockChecking(checking, 'b1', false)[0]?.isChecking).toBe(false);
  });

  it('is a no-op for an unknown block id', () => {
    expect(markBlockChecking(blocks, 'nope', true)).toEqual(blocks);
  });

  it('does not mutate the input', () => {
    markBlockChecking(blocks, 'b1', true);
    expect(blocks[0]?.isChecking).toBe(false);
  });
});
