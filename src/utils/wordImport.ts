/**
 * Shaping of the word list in the import dialog.
 *
 * Kept free of React so the editing rules can be tested directly.
 */

export interface ParsedWord {
  word: string;
  translate: string;
  isDuplicate?: boolean | undefined;
}

export type ImportStep = 'input' | 'parsing' | 'review';

/** Normalises the AI response, defaulting every field the model may omit. */
export function normaliseParsedWords(raw: Array<Partial<ParsedWord>>): ParsedWord[] {
  return raw.map(item => ({
    word: item.word || '',
    translate: item.translate || '',
    isDuplicate: item.isDuplicate || false
  }));
}

export function updateWordAt(
  words: ParsedWord[],
  index: number,
  field: 'word' | 'translate',
  value: string
): ParsedWord[] {
  return words.map((word, i) => (i === index ? { ...word, [field]: value } : word));
}

export function removeWordAt(words: ParsedWord[], index: number): ParsedWord[] {
  return words.filter((_, i) => i !== index);
}

/** Only the new words, stripped of the duplicate flag the API does not want. */
export function wordsToImport(words: ParsedWord[]): Array<{ word: string; translate: string }> {
  return words
    .filter(word => !word.isDuplicate)
    .map(({ word, translate }) => ({ word, translate }));
}

/** Marks the single prefilled word when the server says it already exists. */
export function markDuplicate(word: ParsedWord, isDuplicate: boolean): ParsedWord[] {
  return [{ ...word, isDuplicate }];
}

export function describeFailure(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}
