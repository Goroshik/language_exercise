import { describe, expect, it } from 'vitest';
import {
  cleanWord,
  extractWordAtOffset,
  parseExerciseContent,
  stripTranslationLabel,
  takeHints,
  takeInlineTranslation,
  takeTranslationLine
} from './exerciseContent';

describe('stripTranslationLabel', () => {
  it('drops a Russian label with a colon', () => {
    expect(stripTranslationLabel('Перевод: я читаю')).toBe('я читаю');
  });

  it('drops an English label with a dash', () => {
    expect(stripTranslationLabel('Translation - I am reading')).toBe('I am reading');
  });

  it('leaves an unlabelled line alone', () => {
    expect(stripTranslationLabel('я читаю')).toBe('я читаю');
  });

  it('only strips the label at the start', () => {
    expect(stripTranslationLabel('это перевод: слова')).toBe('это перевод: слова');
  });

  it('trims whitespace after the value', () => {
    expect(stripTranslationLabel('Перевод:   я читаю   ')).toBe('я читаю');
  });

  it('is anchored: a leading space stops the label from matching', () => {
    expect(stripTranslationLabel(' Перевод: я читаю')).toBe('Перевод: я читаю');
  });

  it('accepts a label with no separator at all', () => {
    expect(stripTranslationLabel('Перевод я читаю')).toBe('я читаю');
  });

  it('accepts a label with no space after the colon', () => {
    expect(stripTranslationLabel('Перевод:я читаю')).toBe('я читаю');
  });
});

describe('extractWordAtOffset', () => {
  it('expands from inside a word to its full span', () => {
    expect(extractWordAtOffset('czytam książkę', 10)).toBe('książkę');
  });

  it('expands from the first character', () => {
    expect(extractWordAtOffset('czytam książkę', 0)).toBe('czytam');
  });

  it('expands left when the offset sits just after a word', () => {
    expect(extractWordAtOffset('czytam książkę', 6)).toBe('czytam');
  });

  it('returns an empty string when the offset is surrounded by separators', () => {
    expect(extractWordAtOffset('a  b', 2)).toBe('');
  });

  it('handles an offset at the very end of the text', () => {
    expect(extractWordAtOffset('czytam', 6)).toBe('czytam');
  });

  it('treats digits as word characters', () => {
    expect(extractWordAtOffset('rok 2026 był', 5)).toBe('2026');
  });
});

describe('cleanWord', () => {
  it('lowercases and strips punctuation', () => {
    expect(cleanWord('Książkę,')).toBe('książkę');
  });

  it('rejects tokens that contain digits', () => {
    expect(cleanWord('rok2026')).toBeNull();
  });

  it('rejects an empty token', () => {
    expect(cleanWord('...')).toBeNull();
  });

  it('rejects a token that only ends in letters', () => {
    expect(cleanWord('2026rok')).toBeNull();
  });
});

describe('takeHints', () => {
  it('splits trailing hints off the sentence', () => {
    expect(takeHints('Ona **czyta** książkę. (czytać, książka)')).toEqual({
      line: 'Ona **czyta** książkę.',
      hints: ['czytać', 'książka']
    });
  });

  it('unwraps bold markers inside hints', () => {
    expect(takeHints('Zdanie. (**czytać**)').hints).toEqual(['czytać']);
  });

  it('accepts a semicolon separator', () => {
    expect(takeHints('Zdanie. (a; b)').hints).toEqual(['a', 'b']);
  });

  it('returns no hints when there are no parentheses', () => {
    expect(takeHints('Ona czyta książkę.')).toEqual({
      line: 'Ona czyta książkę.',
      hints: []
    });
  });

  it('ignores parentheses that are not at the end', () => {
    const input = 'Ona (naprawdę) czyta książkę.';
    expect(takeHints(input)).toEqual({ line: input, hints: [] });
  });

  it('drops empty segments between separators', () => {
    expect(takeHints('Zdanie. (a,,b)').hints).toEqual(['a', 'b']);
  });

  it('trims the sentence it returns', () => {
    expect(takeHints('   Zdanie. (a)').line).toBe('Zdanie.');
  });

  it('requires a closing parenthesis', () => {
    const input = 'Zdanie. (a';
    expect(takeHints(input)).toEqual({ line: input, hints: [] });
  });

  it('ignores an empty pair of parentheses', () => {
    const input = 'Zdanie. ()';
    expect(takeHints(input)).toEqual({ line: input, hints: [] });
  });

  it('accepts hints glued to the sentence with no space', () => {
    expect(takeHints('Zdanie.(a)')).toEqual({ line: 'Zdanie.', hints: ['a'] });
  });

  it('accepts trailing whitespace after the hints', () => {
    expect(takeHints('Zdanie. (a)   ')).toEqual({ line: 'Zdanie.', hints: ['a'] });
  });

  it('drops a hint that is only whitespace', () => {
    expect(takeHints('Zdanie. (a, ,b)').hints).toEqual(['a', 'b']);
  });
});

describe('takeInlineTranslation', () => {
  it('splits a sentence from its dash-separated translation', () => {
    expect(takeInlineTranslation('Ona czyta. - Она читает')).toEqual({
      line: 'Ona czyta.',
      translation: 'Она читает'
    });
  });

  it('accepts an em dash', () => {
    expect(takeInlineTranslation('Ona czyta! — Она читает').translation).toBe('Она читает');
  });

  it('strips a translation label after the dash', () => {
    expect(takeInlineTranslation('Ona czyta. - Перевод: Она читает').translation).toBe(
      'Она читает'
    );
  });

  it('requires sentence-ending punctuation before the dash', () => {
    const input = 'Ona czyta - Она читает';
    expect(takeInlineTranslation(input)).toEqual({ line: input, translation: null });
  });

  it('requires something after the dash', () => {
    const input = 'Ona czyta. - ';
    expect(takeInlineTranslation(input)).toEqual({ line: input, translation: null });
  });

  it('accepts an en dash', () => {
    expect(takeInlineTranslation('Ona czyta? – Она читает').translation).toBe('Она читает');
  });

  it('trims whitespace around the sentence', () => {
    expect(takeInlineTranslation('Ona czyta.   -   Она читает').line).toBe('Ona czyta.');
  });

  it('splits on the last sentence-ending punctuation', () => {
    expect(takeInlineTranslation('A. B. - C').line).toBe('A. B.');
  });

  it('accepts a dash glued to the sentence', () => {
    expect(takeInlineTranslation('Ona czyta.- Она читает')).toEqual({
      line: 'Ona czyta.',
      translation: 'Она читает'
    });
  });
});

describe('takeTranslationLine', () => {
  it('prefers a labelled line and removes it', () => {
    const lines = ['Uwaga: czas przeszły', 'Перевод: Она читает'];
    expect(takeTranslationLine(lines)).toBe('Она читает');
    expect(lines).toEqual(['Uwaga: czas przeszły']);
  });

  it('falls back to the first line when nothing is labelled', () => {
    const lines = ['Она читает', 'Uwaga'];
    expect(takeTranslationLine(lines)).toBe('Она читает');
    expect(lines).toEqual(['Uwaga']);
  });

  it('returns null and leaves an empty list untouched', () => {
    const lines: string[] = [];
    expect(takeTranslationLine(lines)).toBeNull();
    expect(lines).toEqual([]);
  });

  it('matches an English label too', () => {
    const lines = ['Note', 'Translation: she reads'];
    expect(takeTranslationLine(lines)).toBe('she reads');
    expect(lines).toEqual(['Note']);
  });

  it('does not treat a word merely starting with the label as one', () => {
    const lines = ['Note', 'Переводчик сказал'];
    expect(takeTranslationLine(lines)).toBe('Note');
  });

  it('only recognises the label at the start of the line', () => {
    const lines = ['Note', 'см. перевод ниже'];
    expect(takeTranslationLine(lines)).toBe('Note');
  });

  it('takes the first labelled line when several are labelled', () => {
    const lines = ['Перевод: первый', 'Перевод: второй'];
    expect(takeTranslationLine(lines)).toBe('первый');
    expect(lines).toEqual(['Перевод: второй']);
  });
});

describe('parseExerciseContent', () => {
  it('returns empty content for a blank string', () => {
    expect(parseExerciseContent('')).toEqual({
      displaySentence: '',
      prefillSentence: '',
      hints: [],
      translation: null,
      additionalNotes: []
    });
  });

  it('returns empty content for whitespace only', () => {
    expect(parseExerciseContent('   \n  \n ').displaySentence).toBe('');
  });

  it('replaces the bold marker with a blank', () => {
    expect(parseExerciseContent('Ona **czyta** książkę.').displaySentence).toBe(
      'Ona _____ książkę.'
    );
  });

  it('replaces the {{input}} placeholder with a blank', () => {
    expect(parseExerciseContent('Ona {{input}} książkę.').displaySentence).toBe(
      'Ona _____ książkę.'
    );
  });

  it('strips leading numbering', () => {
    expect(parseExerciseContent('1. Ona **czyta** książkę.').displaySentence).toBe(
      'Ona _____ książkę.'
    );
  });

  it('strips multi-digit numbering', () => {
    expect(parseExerciseContent('12. Ona **czyta** książkę.').displaySentence).toBe(
      'Ona _____ książkę.'
    );
  });

  it('strips a leading bullet', () => {
    expect(parseExerciseContent('- Ona **czyta** książkę.').displaySentence).toBe(
      'Ona _____ książkę.'
    );
  });

  it('collects hints and keeps them out of the sentence', () => {
    const parsed = parseExerciseContent('Ona **czyta** książkę. (czytać)');
    expect(parsed.hints).toEqual(['czytać']);
    expect(parsed.displaySentence).toBe('Ona _____ książkę.');
  });

  it('takes the translation from a following line when there is no bold marker', () => {
    const parsed = parseExerciseContent('Ona {{input}} książkę.\nОна читает книгу');
    expect(parsed.translation).toBe('Она читает книгу');
    expect(parsed.additionalNotes).toEqual([]);
  });

  it('keeps extra lines as notes when the sentence uses a bold marker', () => {
    const parsed = parseExerciseContent('Ona **czyta** książkę.\nUwaga: czas teraźniejszy');
    expect(parsed.translation).toBeNull();
    expect(parsed.additionalNotes).toEqual(['Uwaga: czas teraźniejszy']);
  });

  it('prefers an inline translation over a following line', () => {
    const parsed = parseExerciseContent('Ona {{input}} książkę. - Она читает\nUwaga');
    expect(parsed.translation).toBe('Она читает');
    expect(parsed.additionalNotes).toEqual(['Uwaga']);
  });

  it('normalises CRLF line endings', () => {
    const parsed = parseExerciseContent('Ona {{input}} książkę.\r\nОна читает');
    expect(parsed.translation).toBe('Она читает');
  });

  it('trims indentation off following lines', () => {
    const parsed = parseExerciseContent('Ona {{input}} książkę.\n    Она читает книгу');
    expect(parsed.translation).toBe('Она читает книгу');
  });

  it('trims surrounding whitespace of the whole block', () => {
    expect(parseExerciseContent('   Ona **czyta** książkę.   ').displaySentence).toBe(
      'Ona _____ książkę.'
    );
  });

  it('only strips numbering from the first line', () => {
    const parsed = parseExerciseContent('1. Ona **czyta**.\n2. Uwaga');
    expect(parsed.additionalNotes).toEqual(['2. Uwaga']);
  });

  it('replaces every bold marker in the sentence', () => {
    expect(parseExerciseContent('**Ona** **czyta**.').displaySentence).toBe('_____ _____.');
  });

  it('replaces every placeholder in the sentence', () => {
    expect(parseExerciseContent('{{input}} czyta {{input}}.').displaySentence).toBe(
      '_____ czyta _____.'
    );
  });

  it('matches the placeholder case-insensitively', () => {
    expect(parseExerciseContent('Ona {{INPUT}} książkę.').displaySentence).toBe(
      'Ona _____ książkę.'
    );
  });

  it('reports no translation when there is nothing to take', () => {
    expect(parseExerciseContent('Ona {{input}} książkę.').translation).toBeNull();
  });

  it('turns an empty translation into null', () => {
    expect(parseExerciseContent('Ona {{input}}.\nПеревод:').translation).toBeNull();
  });

  it('prefills with the same sentence it displays', () => {
    const parsed = parseExerciseContent('Ona **czyta** książkę. (czytać)');
    expect(parsed.prefillSentence).toBe(parsed.displaySentence);
  });
});
