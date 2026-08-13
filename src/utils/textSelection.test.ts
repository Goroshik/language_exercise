import { describe, expect, it } from 'vitest';
import {
  DOUBLE_CLICK_WINDOW_MS,
  MAX_WORD_COUNT,
  MIN_WORD_COUNT,
  TEXT_NODE,
  expandMultiNodeSelection,
  expandSingleNodeSelection,
  expandToFullWords,
  isDoubleClickEcho,
  isInsideInput,
  isTranslatablePhrase,
  popoverPosition,
  textContentOf,
  wordCount,
  wordEnd,
  wordStart
} from './textSelection';

const textNode = (textContent: string) => ({ nodeType: TEXT_NODE, textContent });

const singleNodeRange = (text: string, startOffset: number, endOffset: number) => {
  const node = textNode(text);
  return { startContainer: node, endContainer: node, startOffset, endOffset };
};

describe('wordStart / wordEnd', () => {
  it('finds the start of the word around an offset', () => {
    expect(wordStart('czytam książkę', 10)).toBe(7);
  });

  it('finds the end of the word around an offset', () => {
    expect(wordEnd('czytam książkę', 10)).toBe(14);
  });

  it('stops at the beginning of the text', () => {
    expect(wordStart('czytam', 3)).toBe(0);
  });

  it('stops at the end of the text', () => {
    expect(wordEnd('czytam', 3)).toBe(6);
  });

  it('does not move when the offset sits between separators', () => {
    expect(wordStart('a  b', 2)).toBe(2);
    expect(wordEnd('a  b', 2)).toBe(2);
  });

  it('treats digits as part of a word', () => {
    expect(wordStart('rok 2026', 6)).toBe(4);
    expect(wordEnd('rok 2026', 6)).toBe(8);
  });
});

describe('textContentOf', () => {
  it('reads the content of a text node', () => {
    expect(textContentOf(textNode('hello'))).toBe('hello');
  });

  it('ignores a non-text node', () => {
    expect(textContentOf({ nodeType: 1, textContent: 'hello' })).toBe('');
  });

  it('copes with null content', () => {
    expect(textContentOf({ nodeType: TEXT_NODE, textContent: null })).toBe('');
  });

  it('copes with a node carrying no type', () => {
    expect(textContentOf({})).toBe('');
  });
});

describe('wordCount', () => {
  it('counts words separated by single spaces', () => {
    expect(wordCount('ona czyta książkę')).toBe(3);
  });

  it('collapses runs of whitespace', () => {
    expect(wordCount('ona   czyta')).toBe(2);
  });

  it('counts nothing in an empty string', () => {
    expect(wordCount('')).toBe(0);
  });

  it('counts nothing in whitespace', () => {
    expect(wordCount('   ')).toBe(0);
  });
});

describe('isTranslatablePhrase', () => {
  it('accepts a phrase at the lower bound', () => {
    expect(isTranslatablePhrase('ona czyta')).toBe(true);
  });

  it('accepts a phrase at the upper bound', () => {
    expect(isTranslatablePhrase('a bb cc dd ee')).toBe(true);
  });

  it('rejects a single word', () => {
    expect(isTranslatablePhrase('czyta')).toBe(false);
  });

  it('rejects more words than the maximum', () => {
    expect(isTranslatablePhrase('a bb cc dd ee ff')).toBe(false);
  });

  it('rejects text shorter than the minimum length', () => {
    expect(isTranslatablePhrase('a')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isTranslatablePhrase('')).toBe(false);
  });

  it('agrees with the exported bounds', () => {
    const words = Array.from({ length: MIN_WORD_COUNT }, () => 'ab').join(' ');
    expect(isTranslatablePhrase(words)).toBe(true);
    const tooMany = Array.from({ length: MAX_WORD_COUNT + 1 }, () => 'ab').join(' ');
    expect(isTranslatablePhrase(tooMany)).toBe(false);
  });
});

describe('popoverPosition', () => {
  it('centres horizontally and sits just below', () => {
    expect(popoverPosition({ left: 100, width: 40, bottom: 200 })).toEqual({ x: 120, y: 205 });
  });

  it('handles a zero-width rect', () => {
    expect(popoverPosition({ left: 10, width: 0, bottom: 20 })).toEqual({ x: 10, y: 25 });
  });
});

describe('expandSingleNodeSelection', () => {
  it('grows a partial selection to the whole word', () => {
    expect(expandSingleNodeSelection(singleNodeRange('czytam książkę', 8, 10), 'si')).toBe(
      'książkę'
    );
  });

  it('grows across a space when the selection spans two words', () => {
    expect(expandSingleNodeSelection(singleNodeRange('czytam książkę', 3, 10), 'tam ksi')).toBe(
      'czytam książkę'
    );
  });

  it('falls back to the raw selection for a non-text node', () => {
    const node = { nodeType: 1, textContent: 'czytam' };
    const range = { startContainer: node, endContainer: node, startOffset: 0, endOffset: 3 };
    expect(expandSingleNodeSelection(range, '  czy  ')).toBe('czy');
  });
});

describe('expandMultiNodeSelection', () => {
  it('adds the word prefix and suffix from each end', () => {
    const range = {
      startContainer: textNode('czytam'),
      endContainer: textNode('książkę'),
      startOffset: 3,
      endOffset: 4
    };
    expect(expandMultiNodeSelection(range, 'tam ksią')).toBe('czytam książkę');
  });

  it('trims the result', () => {
    const range = {
      startContainer: textNode(' '),
      endContainer: textNode(' '),
      startOffset: 1,
      endOffset: 0
    };
    expect(expandMultiNodeSelection(range, '  middle  ')).toBe('middle');
  });

  it('adds nothing when both ends are non-text nodes', () => {
    const range = {
      startContainer: { nodeType: 1, textContent: 'czytam' },
      endContainer: { nodeType: 1, textContent: 'książkę' },
      startOffset: 3,
      endOffset: 4
    };
    expect(expandMultiNodeSelection(range, 'selected')).toBe('selected');
  });
});

describe('expandToFullWords', () => {
  it('returns an empty string without a range', () => {
    expect(expandToFullWords(null, 'anything')).toBe('');
  });

  it('uses the single-node path when both ends share a node', () => {
    expect(expandToFullWords(singleNodeRange('czytam książkę', 8, 10), 'si')).toBe('książkę');
  });

  it('uses the multi-node path when the ends differ', () => {
    const range = {
      startContainer: textNode('abc'),
      endContainer: textNode('def'),
      startOffset: 1,
      endOffset: 2
    };
    expect(expandToFullWords(range, 'bcde')).toBe('abcdef');
  });
});

describe('isInsideInput', () => {
  const element = (matches: boolean) => ({ closest: () => (matches ? {} : null) });

  it('detects a selection inside a form field', () => {
    expect(isInsideInput(element(true))).toBe(true);
  });

  it('allows a selection outside a form field', () => {
    expect(isInsideInput(element(false))).toBe(false);
  });

  it('checks the parent element of a text node', () => {
    expect(isInsideInput({ nodeType: TEXT_NODE, parentElement: element(true) })).toBe(true);
  });

  it('copes with a text node that has no parent', () => {
    expect(isInsideInput({ nodeType: TEXT_NODE, parentElement: null })).toBe(false);
  });

  it('copes with a container that cannot be queried', () => {
    expect(isInsideInput({ nodeType: 1 })).toBe(false);
  });
});

describe('isDoubleClickEcho', () => {
  it('recognises a recent double click', () => {
    expect(isDoubleClickEcho(2, 100)).toBe(true);
  });

  it('ignores a single click', () => {
    expect(isDoubleClickEcho(1, 100)).toBe(false);
  });

  it('ignores a triple click', () => {
    expect(isDoubleClickEcho(3, 100)).toBe(false);
  });

  it('ignores a double click that is too old', () => {
    expect(isDoubleClickEcho(2, DOUBLE_CLICK_WINDOW_MS)).toBe(false);
  });

  it('accepts one just inside the window', () => {
    expect(isDoubleClickEcho(2, DOUBLE_CLICK_WINDOW_MS - 1)).toBe(true);
  });
});
