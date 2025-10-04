import React, { useState } from 'react';
import { Typography } from '@mui/material';

import WordTranslationPanel from 'src/components/WordTranslationPanel';

interface LearnModeTextProps {
  text: string;
}

const LearnModeText: React.FC<LearnModeTextProps> = ({ text }) => {
  const [translationPanel, setTranslationPanel] = useState<{
    word: string;
    position: { x: number; y: number };
  } | null>(null);

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

      setTranslationPanel({
        word: selectedWord.toLowerCase(),
        position
      });
    }
  };

  const handleCloseTranslationPanel = () => {
    setTranslationPanel(null);
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
      <Typography variant="body1" sx={{ lineHeight: 1.6, mb: 1 }}>
        {parsedParts.map((part, index) => {
          if (typeof part === 'string') {
            return (
              <span
                key={index}
                style={{ cursor: 'text' }}
                onDoubleClick={handleTextDoubleClick}
              >
                {part}
              </span>
            );
          } else {
            return (
              <strong
                key={index}
                style={{ fontWeight: 'bold', color: '#1976d2', cursor: 'text' }}
                onDoubleClick={handleTextDoubleClick}
              >
                {part.text}
              </strong>
            );
          }
        })}
      </Typography>

      {translationPanel && (
        <WordTranslationPanel
          word={translationPanel.word}
          position={translationPanel.position}
          onClose={handleCloseTranslationPanel}
        />
      )}
    </>
  );
};

export default LearnModeText;
