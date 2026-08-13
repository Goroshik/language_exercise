import { describe, expect, it } from 'vitest';
import {
  type ParsedWord,
  describeFailure,
  markDuplicate,
  normaliseParsedWords,
  removeWordAt,
  updateWordAt,
  wordsToImport
} from './wordImport';

const word = (word: string, translate = '', isDuplicate = false): ParsedWord => ({
  word,
  translate,
  isDuplicate
});

describe('normaliseParsedWords', () => {
  it('keeps a complete entry', () => {
    expect(normaliseParsedWords([{ word: 'book', translate: 'книга', isDuplicate: true }])).toEqual(
      [{ word: 'book', translate: 'книга', isDuplicate: true }]
    );
  });

  it('defaults a missing translation to an empty string', () => {
    expect(normaliseParsedWords([{ word: 'book' }])[0]).toEqual({
      word: 'book',
      translate: '',
      isDuplicate: false
    });
  });

  it('defaults a missing word to an empty string', () => {
    expect(normaliseParsedWords([{ translate: 'книга' }])[0]?.word).toBe('');
  });

  it('defaults the duplicate flag to false', () => {
    expect(normaliseParsedWords([{ word: 'book' }])[0]?.isDuplicate).toBe(false);
  });

  it('keeps one entry per input, in order', () => {
    const result = normaliseParsedWords([{ word: 'a' }, { word: 'b' }]);
    expect(result.map(w => w.word)).toEqual(['a', 'b']);
  });

  it('returns nothing for no input', () => {
    expect(normaliseParsedWords([])).toEqual([]);
  });
});

describe('updateWordAt', () => {
  const words = [word('book', 'книга'), word('table', 'стол')];

  it('changes the word of the addressed row', () => {
    expect(updateWordAt(words, 0, 'word', 'books')[0]?.word).toBe('books');
  });

  it('changes the translation of the addressed row', () => {
    expect(updateWordAt(words, 1, 'translate', 'столик')[1]?.translate).toBe('столик');
  });

  it('leaves the other rows untouched', () => {
    expect(updateWordAt(words, 0, 'word', 'books')[1]).toBe(words[1]);
  });

  it('keeps the duplicate flag of the edited row', () => {
    const flagged = [word('book', 'книга', true)];
    expect(updateWordAt(flagged, 0, 'word', 'books')[0]?.isDuplicate).toBe(true);
  });

  it('is a no-op for an index out of range', () => {
    expect(updateWordAt(words, 9, 'word', 'x')).toEqual(words);
  });

  it('does not mutate the input', () => {
    updateWordAt(words, 0, 'word', 'books');
    expect(words[0]?.word).toBe('book');
  });
});

describe('removeWordAt', () => {
  const words = [word('a'), word('b'), word('c')];

  it('drops the addressed row', () => {
    expect(removeWordAt(words, 1).map(w => w.word)).toEqual(['a', 'c']);
  });

  it('drops the first row', () => {
    expect(removeWordAt(words, 0).map(w => w.word)).toEqual(['b', 'c']);
  });

  it('is a no-op for an index out of range', () => {
    expect(removeWordAt(words, 9)).toHaveLength(3);
  });

  it('does not mutate the input', () => {
    removeWordAt(words, 0);
    expect(words).toHaveLength(3);
  });
});

describe('wordsToImport', () => {
  it('keeps only the new words', () => {
    const words = [word('book', 'книга'), word('table', 'стол', true)];
    expect(wordsToImport(words)).toEqual([{ word: 'book', translate: 'книга' }]);
  });

  it('strips the duplicate flag the API does not accept', () => {
    expect(wordsToImport([word('book', 'книга')])[0]).not.toHaveProperty('isDuplicate');
  });

  it('returns nothing when everything is a duplicate', () => {
    expect(wordsToImport([word('book', 'книга', true)])).toEqual([]);
  });

  it('returns nothing for an empty list', () => {
    expect(wordsToImport([])).toEqual([]);
  });
});

describe('markDuplicate', () => {
  it('flags the word', () => {
    expect(markDuplicate(word('book', 'книга'), true)).toEqual([
      { word: 'book', translate: 'книга', isDuplicate: true }
    ]);
  });

  it('clears the flag', () => {
    expect(markDuplicate(word('book', 'книга', true), false)[0]?.isDuplicate).toBe(false);
  });

  it('always returns a single-entry list', () => {
    expect(markDuplicate(word('book'), true)).toHaveLength(1);
  });
});

describe('describeFailure', () => {
  it('uses the message of an Error', () => {
    expect(describeFailure(new Error('boom'))).toBe('boom');
  });

  it.each([null, undefined, 'boom', 42])('falls back for %s', value => {
    expect(describeFailure(value)).toBe('Unknown error');
  });
});
