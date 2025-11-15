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
const MIN_WORD_COUNT = 2; // Changed from 1 to 2: only show for multiple words
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
  const lastClickTimeRef = useRef<number>(0);
  const lastClickCountRef = useRef<number>(0);

  // Track when translation panel is open
  useEffect(() => {
    isPanelOpenRef.current = translationPanel !== null;
  }, [translationPanel]);

  /**
   * Expands partial word selection to include full words
   * If first or last word is partially selected, expands to full word boundaries
   */
  const expandToFullWords = useCallback((selection: globalThis.Selection): string => {
    if (!selection || selection.rangeCount === 0) {
      return '';
    }

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();
    
    // Get surrounding text context to expand partial words
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;
    
    // If selection spans multiple nodes, use a different approach
    if (startContainer !== endContainer) {
      // For multi-node selection, work with the text of start and end containers
      return expandMultiNodeSelection(range, selectedText);
    }

    // Work with single text node
    const textNode = startContainer.nodeType === globalThis.Node.TEXT_NODE 
      ? startContainer 
      : null;
    
    if (!textNode || !textNode.textContent) {
      return selectedText.trim();
    }

    const fullText = textNode.textContent;
    const startOffset = range.startOffset;
    const endOffset = range.endOffset;

    // Find word boundary at start (look backwards)
    // Use Unicode-aware pattern to include Polish and other special characters
    let expandedStart = startOffset;
    while (expandedStart > 0 && /[\p{L}\p{N}]/u.test(fullText[expandedStart - 1])) {
      expandedStart--;
    }

    // Find word boundary at end (look forwards)
    let expandedEnd = endOffset;
    while (expandedEnd < fullText.length && /[\p{L}\p{N}]/u.test(fullText[expandedEnd])) {
      expandedEnd++;
    }

    // Extract the expanded text
    const expandedText = fullText.substring(expandedStart, expandedEnd).trim();
    return expandedText;
  }, []);

  /**
   * Helper function to expand selection that spans multiple text nodes
   */
  const expandMultiNodeSelection = (range: globalThis.Range, selectedText: string): string => {
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;
    
    let result = selectedText;
    
    // Expand start word
    if (startContainer.nodeType === globalThis.Node.TEXT_NODE && startContainer.textContent) {
      const startText = startContainer.textContent;
      const startOffset = range.startOffset;
      
      // Use Unicode-aware pattern to include Polish and other special characters
      let expandedStart = startOffset;
      while (expandedStart > 0 && /[\p{L}\p{N}]/u.test(startText[expandedStart - 1])) {
        expandedStart--;
      }
      
      const startPrefix = startText.substring(expandedStart, startOffset);
      if (startPrefix) {
        result = startPrefix + result;
      }
    }
    
    // Expand end word
    if (endContainer.nodeType === globalThis.Node.TEXT_NODE && endContainer.textContent) {
      const endText = endContainer.textContent;
      const endOffset = range.endOffset;
      
      // Use Unicode-aware pattern to include Polish and other special characters
      let expandedEnd = endOffset;
      while (expandedEnd < endText.length && /[\p{L}\p{N}]/u.test(endText[expandedEnd])) {
        expandedEnd++;
      }
      
      const endSuffix = endText.substring(endOffset, expandedEnd);
      if (endSuffix) {
        result = result + endSuffix;
      }
    }
    
    return result.trim();
  };

  const handleTextSelection = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Clear any pending timeout
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }

    // Debounce selection to avoid triggering on double-click
    selectionTimeoutRef.current = setTimeout(() => {
      // Check if this was triggered shortly after a double-click
      const timeSinceLastClick = Date.now() - lastClickTimeRef.current;
      if (lastClickCountRef.current === 2 && timeSinceLastClick < 500) {
        // Skip if double-click happened recently (within 500ms)
        return;
      }

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

      // Expand partial word selection to full words
      const expandedText = expandToFullWords(selection);
      
      // Check minimum text length to avoid single character selections
      if (!expandedText || expandedText.length < MIN_TEXT_LENGTH) {
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

      // Count words in expanded selection
      const wordCount = expandedText.split(/\s+/).filter(Boolean).length;
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
        text: expandedText,
        position
      });
    }, SELECTION_DEBOUNCE_DELAY);
  }, [expandToFullWords]);

  // Track click events to detect double-clicks
  const handleClick = useCallback((event: MouseEvent) => {
    lastClickTimeRef.current = Date.now();
    lastClickCountRef.current = event.detail;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Use mouseup to detect when selection is complete
    document.addEventListener('mouseup', handleTextSelection);
    // Track clicks to detect double-clicks
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('click', handleClick);
      // Clear timeout on unmount
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, [handleTextSelection, handleClick]);

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
