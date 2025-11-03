import { useCallback, useEffect, useState } from 'react';

interface SelectionState {
  text: string;
  position: { x: number; y: number };
}

interface UseTextSelectionResult {
  selectionPopover: SelectionState | null;
  translationPanel: { word: string; position: { x: number; y: number } } | null;
  handleSelectionPopoverTranslate: () => void;
  closeSelectionPopover: () => void;
  closeTranslationPanel: () => void;
}

/**
 * Custom hook to handle text selection and translation
 * Shows a "Translate" button popover when text (up to 5 words) is selected
 * Opens translation panel when the button is clicked
 */
export const useTextSelection = (): UseTextSelectionResult => {
  const [selectionPopover, setSelectionPopover] = useState<SelectionState | null>(null);
  const [translationPanel, setTranslationPanel] = useState<{
    word: string;
    position: { x: number; y: number };
  } | null>(null);

  const handleTextSelection = useCallback(() => {
    if (typeof window === 'undefined') return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    // Check if selection is inside an input or textarea
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const parentElement =
      container.nodeType === globalThis.Node.TEXT_NODE
        ? container.parentElement
        : (container as globalThis.Element);

    if (parentElement) {
      const closestInput = parentElement.closest('input, textarea, [contenteditable="true"]');
      if (closestInput) return; // Don't show popover for input fields
    }

    // Count words in selection
    const wordCount = selectedText.split(/\s+/).filter(Boolean).length;
    if (wordCount === 0 || wordCount > 5) return;

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
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Use mouseup to detect when selection is complete
    document.addEventListener('mouseup', handleTextSelection);

    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
    };
  }, [handleTextSelection]);

  const handleSelectionPopoverTranslate = useCallback(() => {
    if (!selectionPopover) return;

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
  }, []);

  const closeTranslationPanel = useCallback(() => {
    setTranslationPanel(null);
  }, []);

  return {
    selectionPopover,
    translationPanel,
    handleSelectionPopoverTranslate,
    closeSelectionPopover,
    closeTranslationPanel
  };
};
