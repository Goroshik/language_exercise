/**
 * Parsing of the raw exercise text produced by the AI providers.
 *
 * The AI returns one exercise per line, optionally followed by extra lines with
 * a translation or notes. A line may carry hints in trailing parentheses and
 * marks the target word either with `**bold**` or a `{{input}}` placeholder.
 *
 * Kept free of React so it can be unit- and mutation-tested on its own.
 */

export interface ParsedExerciseContent {
  displaySentence: string;
  prefillSentence: string;
  hints: string[];
  translation: string | null;
  additionalNotes: string[];
}

const PLACEHOLDER_REGEX = /\{\{input\}\}/gi;
const BOLD_PATTERN = /\*\*([^*]+)\*\*/g;
const TRAILING_HINTS = /\s*\(([^)]+)\)\s*$/;
const TRANSLATION_LABEL = /^(?:перевод|translation)\s*[:−-]?\s*/i;
// `\b` is ASCII-only in JS, so it never fires after a Cyrillic word - a
// Unicode-aware "not followed by a letter or digit" lookahead is required for
// "Перевод:" to be recognised at all.
const TRANSLATION_LINE = /^(?:перевод|translation)(?![\p{L}\p{N}])/iu;
const LEADING_NUMBERING = /^(?:[\d]+[).\s]+|[-*]\s+)/;
// `(\S.*)` rather than `(.+)`: a dangling dash with nothing but spaces after it
// is not a translation, and must leave the sentence untouched.
const INLINE_DASH_TRANSLATION = /^(.*[.!?]\s*)[\s]*[-–—][\s]*(\S.*)$/;
const WORD_CHAR = /[\p{L}\p{N}]/u;

export const EMPTY_PARSED_CONTENT: ParsedExerciseContent = {
  displaySentence: '',
  prefillSentence: '',
  hints: [],
  translation: null,
  additionalNotes: []
};

export const stripTranslationLabel = (value: string): string =>
  value.replace(TRANSLATION_LABEL, '').trim();

/**
 * Widens `offset` to the whole word it sits inside.
 * No bounds checks are needed: `charAt` returns '' outside the string, which
 * never matches WORD_CHAR and therefore stops the scan on its own.
 */
export const extractWordAtOffset = (text: string, offset: number): string => {
  let start = offset;
  let end = offset;

  while (WORD_CHAR.test(text.charAt(start - 1))) {
    start--;
  }
  while (WORD_CHAR.test(text.charAt(end))) {
    end++;
  }

  return text.substring(start, end);
};

/** Normalises a selected token, or null when it is not a plain word. */
export const cleanWord = (raw: string): string | null => {
  const cleaned = raw.replace(/[^\p{L}\p{N}]/gu, '');
  return cleaned && /^[\p{L}]+$/u.test(cleaned) ? cleaned.toLowerCase() : null;
};

/**
 * Removes the translation line from `extraLines` and returns it.
 * Prefers an explicitly labelled line ("Перевод: ..."), otherwise takes the
 * first remaining line. Returns null when there is nothing left to take.
 */
export const takeTranslationLine = (extraLines: string[]): string | null => {
  const labelled = extraLines.findIndex(line => TRANSLATION_LINE.test(line));
  const index = labelled === -1 ? 0 : labelled;
  const line = extraLines[index];

  if (line === undefined) return null;

  extraLines.splice(index, 1);
  return stripTranslationLabel(line);
};

/** Splits trailing "(hint1, hint2)" off a sentence. */
export const takeHints = (line: string): { line: string; hints: string[] } => {
  const match = line.match(TRAILING_HINTS);
  if (!match?.[1]) return { line, hints: [] };

  const hints = match[1]
    .split(/[,;]+/)
    .map(part => part.trim().replace(BOLD_PATTERN, '$1'))
    .filter(Boolean);

  return { line: line.replace(TRAILING_HINTS, '').trim(), hints };
};

/** Splits an inline "Sentence. - translation" pair. */
export const takeInlineTranslation = (
  line: string
): { line: string; translation: string | null } => {
  const match = line.match(INLINE_DASH_TRANSLATION);
  if (!match) return { line, translation: null };

  const [, sentence = '', translation = ''] = match;
  return { line: sentence.trim(), translation: stripTranslationLabel(translation) };
};

// `split` on '\n' plus a per-line trim already handles CRLF and indentation,
// so no separate newline normalisation or outer trim is needed here.
const splitLines = (rawText: string): string[] =>
  rawText
    .trim()
    .replace(LEADING_NUMBERING, '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

export const parseExerciseContent = (rawText: string): ParsedExerciseContent => {
  const lines = splitLines(rawText);
  const firstLine = lines[0];
  if (firstLine === undefined) return EMPTY_PARSED_CONTENT;

  const additionalNotes = lines.slice(1);
  const withoutHints = takeHints(firstLine);
  const withoutInline = takeInlineTranslation(withoutHints.line);

  BOLD_PATTERN.lastIndex = 0;
  const hasBoldFormat = BOLD_PATTERN.test(withoutInline.line);

  const translation =
    withoutInline.translation ?? (hasBoldFormat ? null : takeTranslationLine(additionalNotes));

  const displaySentence = hasBoldFormat
    ? withoutInline.line.replace(BOLD_PATTERN, '_____')
    : withoutInline.line.replace(PLACEHOLDER_REGEX, '_____');

  return {
    displaySentence,
    prefillSentence: displaySentence,
    hints: withoutHints.hints,
    translation: translation || null,
    additionalNotes
  };
};
