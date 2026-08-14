import { useCallback, useEffect, useRef, useState } from 'react';
import type { TranslationPanelState } from 'src/types/translation';
import {
  SELECTION_DEBOUNCE_DELAY,
  type SelectionState,
  expandToFullWords,
  isDoubleClickEcho,
  isInsideInput,
  isTranslatablePhrase,
  popoverPosition
} from 'src/utils/textSelection';

interface UseTextSelectionResult {
  selectionPopover: SelectionState | null;
  translationPanel: TranslationPanelState | null;
  handleSelectionPopoverTranslate: () => void;
  closeSelectionPopover: () => void;
  closeTranslationPanel: () => void;
}

/** The phrase worth offering for translation, or null to hide the popover. */
function readSelection(): SelectionState | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  const text = expandToFullWords(range, selection.toString());

  if (!isTranslatablePhrase(text)) return null;
  if (isInsideInput(range.commonAncestorContainer)) return null;

  return { text, position: popoverPosition(range.getBoundingClientRect()) };
}

const clearWindowSelection = () => {
  if (typeof window !== 'undefined') {
    window.getSelection()?.removeAllRanges();
  }
};

/**
 * Watches the document for selections and reports the debounced result.
 * Selections that merely echo a double click, or arrive while the translation
 * panel is open, are ignored.
 */
function useSelectionWatcher(
  isPanelOpen: boolean,
  onSelection: (selection: SelectionState | null) => void
): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPanelOpenRef = useRef<boolean>(false);
  const lastClickTimeRef = useRef<number>(0);
  const lastClickCountRef = useRef<number>(0);

  useEffect(() => {
    isPanelOpenRef.current = isPanelOpen;
  }, [isPanelOpen]);

  const handleTextSelection = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const sinceLastClick = Date.now() - lastClickTimeRef.current;
      if (isDoubleClickEcho(lastClickCountRef.current, sinceLastClick)) return;
      if (isPanelOpenRef.current) return;

      onSelection(readSelection());
    }, SELECTION_DEBOUNCE_DELAY);
  }, [onSelection]);

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
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [handleTextSelection, handleClick]);
}

export const useTextSelection = (): UseTextSelectionResult => {
  const [selectionPopover, setSelectionPopover] = useState<SelectionState | null>(null);
  const [translationPanel, setTranslationPanel] = useState<TranslationPanelState | null>(null);

  useSelectionWatcher(translationPanel !== null, setSelectionPopover);

  const handleSelectionPopoverTranslate = useCallback(() => {
    if (!selectionPopover) return;

    clearWindowSelection();
    setSelectionPopover(null);
    setTranslationPanel({ word: selectionPopover.text, position: selectionPopover.position });
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
