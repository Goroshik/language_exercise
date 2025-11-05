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

// Selector for input elements where text selection should be ignored
const INPUT_ELEMENTS_SELECTOR = 'input, textarea, [contenteditable="true"]';

// Word count limits for text selection
const MIN_WORD_COUNT = 1;
const MAX_WORD_COUNT = 5;

// Minimum text length to consider as valid selection (prevents accidental single char selections)
const MIN_TEXT_LENGTH = 2;

// Delay to debounce selection events (prevents triggering on double-click)
// Increased to 300ms to better handle double-click scenarios
const SELECTION_DEBOUNCE_DELAY = 300;

/**
 * Custom hook to handle text selection and translation
 * Shows a "Translate" button popover when text (up to 5 words) is selected
 * Opens translation panel when the button is clicked
 */
export const useTextSelection = (): UseTextSelectionResult => {
  const [selectionPopover, setSelectionPopover] = useState<SelectionState | null>(null);
  const [translationPanel, setTranslationPanel] = useState<TranslationPanelState | null>(null);
  const selectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPanelOpenRef = useRef<boolean>(false);

  // Track when translation panel is open
  useEffect(() => {
    isPanelOpenRef.current = translationPanel !== null;
  }, [translationPanel]);

  const handleTextSelection = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Clear any pending timeout
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }

    // Debounce selection to avoid triggering on double-click
    selectionTimeoutRef.current = setTimeout(() => {
      // Don't show popover if translation panel is open
      if (isPanelOpenRef.current) {
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        // Close popover if there's no selection
        setSelectionPopover(null);
        return;
      }

      const selectedText = selection.toString().trim();
      
      // Check minimum text length to avoid single character selections
      if (!selectedText || selectedText.length < MIN_TEXT_LENGTH) {
        setSelectionPopover(null);
        return;
      }

      // Check if selection is inside an input or textarea
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const parentElement =
        container.nodeType === globalThis.Node.TEXT_NODE
          ? container.parentElement
          : (container as globalThis.Element);

      if (parentElement) {
        const closestInput = parentElement.closest(INPUT_ELEMENTS_SELECTOR);
        if (closestInput) {
          setSelectionPopover(null);
          return; // Don't show popover for input fields
        }
      }

      // Count words in selection
      const wordCount = selectedText.split(/\s+/).filter(Boolean).length;
      if (wordCount < MIN_WORD_COUNT || wordCount > MAX_WORD_COUNT) {
        setSelectionPopover(null);
        return;
      }

      // Get selection position
      const rect = range.getBoundingClientRect();
      const position = {
        x: rect.left + rect.width / 2,
        y: rect.bottom + 5
      };

      setSelectionPopover({
        text: selectedText,
        position
      });
    }, SELECTION_DEBOUNCE_DELAY);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Use mouseup to detect when selection is complete
    document.addEventListener('mouseup', handleTextSelection);

    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      // Clear timeout on unmount
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, [handleTextSelection]);

  const handleSelectionPopoverTranslate = useCallback(() => {
    if (!selectionPopover) return;

    // Clear text selection to prevent re-triggering
    if (typeof window !== 'undefined') {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
      }
    }

    // Close selection popover
    setSelectionPopover(null);

    // Open translation panel with the selected text
    setTranslationPanel({
      word: selectionPopover.text,
      position: selectionPopover.position
    });
  }, [selectionPopover]);

  const closeSelectionPopover = useCallback(() => {
    setSelectionPopover(null);
    // Also clear text selection
    if (typeof window !== 'undefined') {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
      }
    }
  }, []);

  const closeTranslationPanel = useCallback(() => {
    setTranslationPanel(null);
    // Clear text selection when closing translation panel
    if (typeof window !== 'undefined') {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
      }
    }
  }, []);

  return {
    selectionPopover,
    translationPanel,
    handleSelectionPopoverTranslate,
    closeSelectionPopover,
    closeTranslationPanel
  };
};
