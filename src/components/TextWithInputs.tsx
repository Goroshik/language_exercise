import React, { useState } from 'react';
import { Box, Button, Stack, TextField } from '@mui/material';

import WordTranslationPanel from './WordTranslationPanel';

interface TextWithInputsProps {
  text: string;
  exerciseIndex?: string | number;
  validationResults?: {
    [key: string]: { isCorrect: boolean; error?: string; incorrectTranslations?: string[] };
  };
}

const TextWithInputs: React.FC<TextWithInputsProps> = ({
  text,
  exerciseIndex = 0,
  validationResults = {}
}) => {
  const [textareaValue, setTextareaValue] = useState('');
  const [translationPanel, setTranslationPanel] = useState<{
    word: string;
    position: { x: number; y: number };
  } | null>(null);

  // Generate unique textarea ID for this exercise
  const textareaId = `textarea_${exerciseIndex}`;

  // Parse text and create display version (with gaps) and prefill version
  const parseTextForDisplay = (text: string) => {
    // Replace {{input}} with ___ for display
    return text.replace(/\{\{input\}\}/g, '___');
  };

  const handlePrefillClick = () => {
    const displayText = parseTextForDisplay(text);
    setTextareaValue(displayText);
  };

  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextareaValue(event.target.value);
  };

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

  const displayText = parseTextForDisplay(text);

  // Get validation result for this exercise
  const validationResult = validationResults[textareaId];
  const isValidated = !!validationResult;
  const isCorrect = validationResult?.isCorrect;
  const errorMessage = validationResult?.error;
  const incorrectTranslations = validationResult?.incorrectTranslations;

  return (
    <>
      <Stack flexDirection="column" gap={2} sx={{ width: '100%' }}>
        {/* Display sentence with gaps */}
        <Box
          sx={{
            fontSize: '1rem',
            lineHeight: 1.5,
            cursor: 'text',
            whiteSpace: 'pre-wrap'
          }}
          onDoubleClick={handleTextDoubleClick}
        >
          {displayText}
        </Box>

        {/* Multiline textarea input */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              id={textareaId}
              multiline
              rows={3}
              fullWidth
              variant="outlined"
              value={textareaValue}
              onChange={handleTextareaChange}
              placeholder="Введите ваш ответ здесь..."
              className={`exercise-input ${isValidated ? (isCorrect ? 'exercise-input-correct' : 'exercise-input-incorrect') : ''}`}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={handlePrefillClick}
              sx={{
                textTransform: 'none',
                whiteSpace: 'nowrap',
                minWidth: 'auto',
                height: 'fit-content'
              }}
            >
              Предзаполнить
            </Button>
          </Box>

          {/* Show error message if validation failed */}
          {isValidated && !isCorrect && errorMessage && (
            <Box
              sx={{
                fontSize: '0.875rem',
                color: '#d32f2f',
                padding: 1,
                backgroundColor: '#ffebee',
                borderRadius: 1
              }}
            >
              {errorMessage}
            </Box>
          )}

          {/* Show incorrect translations if any */}
          {isValidated && incorrectTranslations && incorrectTranslations.length > 0 && (
            <Box
              sx={{
                fontSize: '0.875rem',
                color: '#d32f2f',
                padding: 1,
                backgroundColor: '#ffebee',
                borderRadius: 1
              }}
            >
              <strong>Неправильные переводы:</strong>
              <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                {incorrectTranslations.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </Box>
          )}
        </Box>
      </Stack>

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

export default TextWithInputs;
