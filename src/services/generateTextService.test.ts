import { describe, expect, it } from 'vitest';
import type { DictionaryWord } from 'src/types';
import {
  buildSentenceRecords,
  buildWordIdIndex,
  collectUsedWordIds,
  extractHints,
  formatAIResponse
} from './generateTextService';

const word = (id: string, text: string): DictionaryWord => ({
  id,
  word: text,
  translate: '',
  createdAt: new Date(0)
});

describe('buildWordIdIndex', () => {
  it('indexes words lower-cased', () => {
    expect(buildWordIdIndex([word('1', 'Książka')]).get('książka')).toBe('1');
  });

  it('skips entries with an empty word', () => {
    expect(buildWordIdIndex([word('1', '')]).size).toBe(0);
  });

  it('keeps the last id when a word repeats', () => {
    expect(buildWordIdIndex([word('1', 'kot'), word('2', 'kot')]).get('kot')).toBe('2');
  });
});

describe('extractHints', () => {
  it('reads a single trailing hint', () => {
    expect(extractHints('Ona czyta. (czytać)')).toEqual(['czytać']);
  });

  it('splits hints on commas and semicolons', () => {
    expect(extractHints('Ona czyta. (czytać; książka, dom)')).toEqual(['czytać', 'książka', 'dom']);
  });

  it('returns nothing when there are no parentheses', () => {
    expect(extractHints('Ona czyta.')).toEqual([]);
  });

  it('ignores parentheses in the middle of the sentence', () => {
    expect(extractHints('Ona (naprawdę) czyta.')).toEqual([]);
  });
});

describe('collectUsedWordIds', () => {
  const index = buildWordIdIndex([word('1', 'czyta'), word('2', 'książkę')]);

  it('matches bold-marked words case-insensitively', () => {
    expect(collectUsedWordIds('Ona **Czyta** książkę.', index)).toEqual(['1']);
  });

  it('collects every bold marker in the sentence', () => {
    expect(collectUsedWordIds('Ona **czyta** **książkę**.', index)).toEqual(['1', '2']);
  });

  it('deduplicates repeated words', () => {
    expect(collectUsedWordIds('**czyta** i **czyta**', index)).toEqual(['1']);
  });

  it('ignores bold words that are not in the dictionary', () => {
    expect(collectUsedWordIds('Ona **biega**.', index)).toEqual([]);
  });

  it('ignores words that are not bold', () => {
    expect(collectUsedWordIds('Ona czyta książkę.', index)).toEqual([]);
  });
});

describe('buildSentenceRecords', () => {
  const context = {
    ownerId: 'u1',
    languageId: 'pl',
    level: 'A1',
    mode: 'student',
    topic: 'Present'
  };

  it('strips hints from the stored sentence but keeps them alongside', () => {
    const [record] = buildSentenceRecords(
      ['Ona **czyta** książkę. (czytać)'],
      buildWordIdIndex([word('1', 'czyta')]),
      context
    );

    expect(record).toMatchObject({
      ownerId: 'u1',
      sentence: 'Ona **czyta** książkę.',
      hints: ['czytać'],
      usedWordIds: ['1']
    });
  });

  it('produces one record per sentence', () => {
    expect(buildSentenceRecords(['a.', 'b.'], new Map(), context)).toHaveLength(2);
  });

  it('returns nothing for an empty batch', () => {
    expect(buildSentenceRecords([], new Map(), context)).toEqual([]);
  });
});

describe('formatAIResponse', () => {
  it('drops blank lines', () => {
    expect(formatAIResponse('a\n\n\nb')).toEqual(['a', 'b']);
  });

  it('strips numbering and bullets', () => {
    expect(formatAIResponse('1. one\n2) two\n- three\n* four')).toEqual([
      'one',
      'two',
      'three',
      'four'
    ]);
  });

  it('leaves a correctly bolded line untouched', () => {
    expect(formatAIResponse('Ona **czyta** książkę.')).toEqual(['Ona **czyta** książkę.']);
  });

  it('normalises runs of three or more asterisks', () => {
    expect(formatAIResponse('Ona ***czyta*** książkę.')).toEqual(['Ona **czyta** książkę.']);
  });

  it('repairs a trailing-only bold marker', () => {
    expect(formatAIResponse('Ona czyta** książkę.')).toEqual(['Ona **czyta** książkę.']);
  });
});
