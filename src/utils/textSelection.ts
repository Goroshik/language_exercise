/**
 * Turning a raw browser selection into a translatable phrase.
 *
 * Kept free of React and of the DOM globals - the node type is compared against
 * the numeric constant rather than `Node.TEXT_NODE` - so it can be tested with
 * plain objects.
 */

export interface SelectionState {
  text: string;
  position: { x: number; y: number };
}

/** Node.TEXT_NODE, spelled out so the module needs no DOM global. */
export const TEXT_NODE = 3;

export const INPUT_ELEMENTS_SELECTOR = 'input, textarea, [contenteditable="true"]';
export const MIN_WORD_COUNT = 2;
export const MAX_WORD_COUNT = 5;
export const MIN_TEXT_LENGTH = 2;
export const SELECTION_DEBOUNCE_DELAY = 300;
export const DOUBLE_CLICK_WINDOW_MS = 500;

const WORD_CHAR = /[\p{L}\p{N}]/u;

/** How far a word extends to the left of `offset`. */
export function wordStart(text: string, offset: number): number {
  let start = offset;
  while (start > 0 && WORD_CHAR.test(text.charAt(start - 1))) {
    start--;
  }
  return start;
}

/** How far a word extends to the right of `offset`. */
export function wordEnd(text: string, offset: number): number {
  let end = offset;
  while (end < text.length && WORD_CHAR.test(text.charAt(end))) {
    end++;
  }
  return end;
}

/** The text content of a node, but only when it is a text node. */
export function textContentOf(node: { nodeType?: number; textContent?: string | null }): string {
  return node.nodeType === TEXT_NODE ? node.textContent || '' : '';
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** A phrase is offered for translation only when it is 2 to 5 words long. */
export function isTranslatablePhrase(text: string): boolean {
  if (text.length < MIN_TEXT_LENGTH) return false;

  const count = wordCount(text);
  return count >= MIN_WORD_COUNT && count <= MAX_WORD_COUNT;
}

export function popoverPosition(rect: {
  left: number;
  width: number;
  bottom: number;
}): SelectionState['position'] {
  return { x: rect.left + rect.width / 2, y: rect.bottom + 5 };
}

interface RangeLike {
  startContainer: { nodeType?: number; textContent?: string | null };
  endContainer: { nodeType?: number; textContent?: string | null };
  startOffset: number;
  endOffset: number;
}

/** Grows a selection that spans several nodes out to whole words at each end. */
export function expandMultiNodeSelection(range: RangeLike, selectedText: string): string {
  const startText = textContentOf(range.startContainer);
  const endText = textContentOf(range.endContainer);

  const prefix = startText.substring(wordStart(startText, range.startOffset), range.startOffset);
  const suffix = endText.substring(range.endOffset, wordEnd(endText, range.endOffset));

  return `${prefix}${selectedText}${suffix}`.trim();
}

/** Grows a selection inside a single text node out to whole words. */
export function expandSingleNodeSelection(range: RangeLike, selectedText: string): string {
  const fullText = textContentOf(range.startContainer);
  if (!fullText) return selectedText.trim();

  const start = wordStart(fullText, range.startOffset);
  const end = wordEnd(fullText, range.endOffset);

  return fullText.substring(start, end).trim();
}

export function expandToFullWords(range: RangeLike | null, selectedText: string): string {
  if (!range) return '';

  return range.startContainer === range.endContainer
    ? expandSingleNodeSelection(range, selectedText)
    : expandMultiNodeSelection(range, selectedText);
}

/** Selections inside a form field belong to the field, not to the translator. */
export function isInsideInput(container: {
  nodeType?: number;
  parentElement?: { closest(selector: string): unknown } | null;
  closest?(selector: string): unknown;
}): boolean {
  const element = container.nodeType === TEXT_NODE ? container.parentElement : container;
  return Boolean(element?.closest?.(INPUT_ELEMENTS_SELECTOR));
}

/** True when a double click happened recently enough to own the selection. */
export function isDoubleClickEcho(clickCount: number, msSinceClick: number): boolean {
  return clickCount === 2 && msSinceClick < DOUBLE_CLICK_WINDOW_MS;
}
