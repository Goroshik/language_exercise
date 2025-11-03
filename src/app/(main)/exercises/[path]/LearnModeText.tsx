import React, { useState } from 'react';
import {
  LearnModeTextBold,
  LearnModeTextSpan,
  LearnModeTextTypography
} from './LearnModeText.styled';

import { useTextSelection } from 'src/hooks/useTextSelection';
import type { TranslationPanelState } from 'src/types/translation';
import TextSelectionPopover from 'src/components/TextSelectionPopover';
import WordTranslationPanel from 'src/components/WordTranslationPanel';

interface LearnModeTextProps {
  text: string;
}

const LearnModeText: React.FC<LearnModeTextProps> = ({ text }) => {
  const [doubleClickTranslationPanel, setDoubleClickTranslationPanel] =
    useState<TranslationPanelState | null>(null);

  // Use the text selection hook for multiword translation
  const {
    selectionPopover,
    translationPanel: selectionTranslationPanel,
    handleSelectionPopoverTranslate,
    closeSelectionPopover,
    closeTranslationPanel: closeSelectionTranslationPanel
  } = useTextSelection();

  // NOTE: Handle double-click on text to extract and translate words
  const handleTextDoubleClick = (event: React.MouseEvent) => {
    // NOTE: Check if window is available (client-side only)
    if (typeof window === 'undefined') return;

    const target = event.target as HTMLElement;
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const clickedText = target.textContent || '';

    // Extract word at click position
    const clickOffset = range.startOffset;
    const words = clickedText.split(/\s+/);
    let currentOffset = 0;
    let selectedWord = '';

    for (const word of words) {
      const wordEnd = currentOffset + word.length;
      if (clickOffset >= currentOffset && clickOffset <= wordEnd) {
        // Clean word from punctuation
        selectedWord = word.replace(/[^\w]/g, '');
        break;
      }
      currentOffset = wordEnd + 1; // +1 for space
    }

    if (selectedWord && /^[a-zA-Z]+$/.test(selectedWord)) {
      // Get click position for panel placement
      const position = {
        x: event.clientX,
        y: event.clientY + 10
      };

      setDoubleClickTranslationPanel({
        word: selectedWord.toLowerCase(),
        position
      });
    }
  };

  const handleCloseDoubleClickTranslationPanel = () => {
    setDoubleClickTranslationPanel(null);
  };

  // Parse text and convert **bold** markings to actual bold text
  const parseTextWithBold = (text: string) => {
    const parts: (string | { type: 'bold'; text: string })[] = [];
    const regex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the bold part
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // Add the bold part
      parts.push({ type: 'bold', text: match[1] });

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  const parsedParts = parseTextWithBold(text);

  return (
    <>
      <LearnModeTextTypography variant="body1">
        {parsedParts.map((part, index) => {
          if (typeof part === 'string') {
            return (
              <LearnModeTextSpan key={index} onDoubleClick={handleTextDoubleClick}>
                {part}
              </LearnModeTextSpan>
            );
          } else {
            return (
              <LearnModeTextBold key={index} onDoubleClick={handleTextDoubleClick}>
                {part.text}
              </LearnModeTextBold>
            );
          }
        })}
      </LearnModeTextTypography>

      {/* Text selection popover - shows "Translate" button for selected text */}
      {selectionPopover && (
        <TextSelectionPopover
          position={selectionPopover.position}
          onTranslate={handleSelectionPopoverTranslate}
          onClose={closeSelectionPopover}
        />
      )}

      {/* Translation panel from text selection */}
      {selectionTranslationPanel && (
        <WordTranslationPanel
          word={selectionTranslationPanel.word}
          position={selectionTranslationPanel.position}
          onClose={closeSelectionTranslationPanel}
        />
      )}

      {/* Translation panel from double-click */}
      {doubleClickTranslationPanel && (
        <WordTranslationPanel
          word={doubleClickTranslationPanel.word}
          position={doubleClickTranslationPanel.position}
          onClose={handleCloseDoubleClickTranslationPanel}
        />
      )}
    </>
  );
};

export default LearnModeText;
