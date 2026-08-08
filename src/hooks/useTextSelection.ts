import { useCallback, useEffect, useRef, useState } from 'react';
import type { TranslationPanelState } from 'src/types/translation';

interface SelectionState {
  text: string;
  position: { x: number; y: number };
}

interface UseTextSelectionResult {
  selectionPopover: SelectionState | null;
  translationPanel: TranslationPanelState | null;
  handleSelectionPopoverTranslate: () => void;
  closeSelectionPopover: () => void;
  closeTranslationPanel: () => void;
}

const INPUT_ELEMENTS_SELECTOR = 'input, textarea, [contenteditable="true"]';
const MIN_WORD_COUNT = 2;
const MAX_WORD_COUNT = 5;
const MIN_TEXT_LENGTH = 2;
const SELECTION_DEBOUNCE_DELAY = 300;
const WORD_CHAR = /[\p{L}\p{N}]/u;

const expandMultiNodeSelection = (range: globalThis.Range, selectedText: string): string => {
  const startContainer = range.startContainer;
  const endContainer = range.endContainer;
  let result = selectedText;

  if (startContainer.nodeType === globalThis.Node.TEXT_NODE && startContainer.textContent) {
    const startText = startContainer.textContent;
    const startOffset = range.startOffset;
    let expandedStart = startOffset;
    while (expandedStart > 0 && WORD_CHAR.test(startText.charAt(expandedStart - 1))) {
      expandedStart--;
    }
    const startPrefix = startText.substring(expandedStart, startOffset);
    if (startPrefix) {
      result = startPrefix + result;
    }
  }

  if (endContainer.nodeType === globalThis.Node.TEXT_NODE && endContainer.textContent) {
    const endText = endContainer.textContent;
    const endOffset = range.endOffset;
    let expandedEnd = endOffset;
    while (expandedEnd < endText.length && WORD_CHAR.test(endText.charAt(expandedEnd))) {
      expandedEnd++;
    }
    const endSuffix = endText.substring(endOffset, expandedEnd);
    if (endSuffix) {
      result = result + endSuffix;
    }
  }

  return result.trim();
};

export const useTextSelection = (): UseTextSelectionResult => {
  const [selectionPopover, setSelectionPopover] = useState<SelectionState | null>(null);
  const [translationPanel, setTranslationPanel] = useState<TranslationPanelState | null>(null);
  const selectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPanelOpenRef = useRef<boolean>(false);
  const lastClickTimeRef = useRef<number>(0);
  const lastClickCountRef = useRef<number>(0);

  useEffect(() => {
    isPanelOpenRef.current = translationPanel !== null;
  }, [translationPanel]);

  const expandToFullWords = useCallback((selection: globalThis.Selection): string => {
    if (!selection || selection.rangeCount === 0) {
      return '';
    }

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;

    if (startContainer !== endContainer) {
      return expandMultiNodeSelection(range, selectedText);
    }

    const textNode = startContainer.nodeType === globalThis.Node.TEXT_NODE ? startContainer : null;

    if (!textNode || !textNode.textContent) {
      return selectedText.trim();
    }

    const fullText = textNode.textContent;
    let expandedStart = range.startOffset;
    while (expandedStart > 0 && WORD_CHAR.test(fullText.charAt(expandedStart - 1))) {
      expandedStart--;
    }

    let expandedEnd = range.endOffset;
    while (expandedEnd < fullText.length && WORD_CHAR.test(fullText.charAt(expandedEnd))) {
      expandedEnd++;
    }

    return fullText.substring(expandedStart, expandedEnd).trim();
  }, []);

  const handleTextSelection = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }

    selectionTimeoutRef.current = setTimeout(() => {
      const timeSinceLastClick = Date.now() - lastClickTimeRef.current;
      if (lastClickCountRef.current === 2 && timeSinceLastClick < 500) {
        return;
      }

      if (isPanelOpenRef.current) {
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setSelectionPopover(null);
        return;
      }

      const expandedText = expandToFullWords(selection);

      if (!expandedText || expandedText.length < MIN_TEXT_LENGTH) {
        setSelectionPopover(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const parentElement =
        container.nodeType === globalThis.Node.TEXT_NODE
          ? container.parentElement
          : (container as globalThis.Element);

      if (parentElement?.closest(INPUT_ELEMENTS_SELECTOR)) {
        setSelectionPopover(null);
        return;
      }

      const wordCount = expandedText.split(/\s+/).filter(Boolean).length;
      if (wordCount < MIN_WORD_COUNT || wordCount > MAX_WORD_COUNT) {
        setSelectionPopover(null);
        return;
      }

      const rect = range.getBoundingClientRect();
      setSelectionPopover({
        text: expandedText,
        position: {
          x: rect.left + rect.width / 2,
          y: rect.bottom + 5
        }
      });
    }, SELECTION_DEBOUNCE_DELAY);
  }, [expandToFullWords]);

  const handleClick = useCallback((event: MouseEvent) => {
    lastClickTimeRef.current = Date.now();
    lastClickCountRef.current = event.detail;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('click', handleClick);
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, [handleTextSelection, handleClick]);

  const clearWindowSelection = () => {
    if (typeof window !== 'undefined') {
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleSelectionPopoverTranslate = useCallback(() => {
    if (!selectionPopover) return;

    clearWindowSelection();
    setSelectionPopover(null);
    setTranslationPanel({
      word: selectionPopover.text,
      position: selectionPopover.position
    });
  }, [selectionPopover]);

  const closeSelectionPopover = useCallback(() => {
    setSelectionPopover(null);
    clearWindowSelection();
  }, []);

  const closeTranslationPanel = useCallback(() => {
    setTranslationPanel(null);
    clearWindowSelection();
  }, []);

  return {
    selectionPopover,
    translationPanel,
    handleSelectionPopoverTranslate,
    closeSelectionPopover,
    closeTranslationPanel
  };
};
