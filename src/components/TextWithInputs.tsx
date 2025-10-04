import React, {useState} from 'react';
import {Box, Stack, TextField} from '@mui/material';

import WordTranslationPanel from './WordTranslationPanel';

interface TextWithInputsProps {
  text: string;
  exerciseIndex?: string | number;
  validationResults?: { [key: string]: { isCorrect: boolean; error?: string } };
}

interface InputData {
  id: string;
  value: string;
}


const TextWithInputs: React.FC<TextWithInputsProps> = ({text, exerciseIndex = 0, validationResults = {}}) => {
  const [inputs, setInputs] = useState<InputData[]>([]);
  const [translationPanel, setTranslationPanel] = useState<{
    word: string;
    position: { x: number; y: number };
  } | null>(null);

  // Парсим текст и находим все триггеры вида {{input}}
  const parseText = (text: string) => {
    const parts: (string | { type: 'input'; id: string })[] = [];
    const regex = /\{\{input\}\}/g;
    let lastIndex = 0;
    let match;
    let inputCounter = 0;

    while ((match = regex.exec(text)) !== null) {
      // Добавляем текст перед триггером
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // Добавляем маркер инпута с индексом упражнения
      const inputId = `input_${exerciseIndex}_${inputCounter++}`;
      parts.push({type: 'input', id: inputId});

      // Инициализируем значение инпута если его еще нет
      if (!inputs.find(input => input.id === inputId)) {
        setInputs(prev => [...prev, {id: inputId, value: ''}]);
      }

      lastIndex = regex.lastIndex;
    }

    // Добавляем оставшийся текст
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  const handleInputChange = (id: string, value: string) => {
    setInputs(prev =>
      prev.map(input =>
        input.id === id ? {...input, value} : input
      )
    );
  };

  const getInputValue = (id: string) => {
    const input = inputs.find(input => input.id === id);
    return input ? input.value : '';
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

  const parsedParts = parseText(text);

  return (
    <>
      <Stack  flexWrap="wrap" alignItems="center" gap={8}>
        {parsedParts.map((part, index) => {
          if (typeof part === 'string') {
            return (
              <span
                key={index}
                style={{whiteSpace: 'pre-wrap', cursor: 'text'}}
                onDoubleClick={handleTextDoubleClick}
              >
                {part}
              </span>
            );
          } else {
            const isValidated = validationResults.hasOwnProperty(part.id);
            const validationResult = validationResults[part.id];
            const isCorrect = validationResult?.isCorrect;
            const errorMessage = validationResult?.error;

            return (
              <Stack flexDirection="column" alignItems="flex-start" key={index}>
                <TextField
                  id={part.id}
                  size="small"
                  variant="outlined"
                  value={getInputValue(part.id)}
                  onChange={(e) => handleInputChange(part.id, e.target.value)}
                  className={`exercise-input ${isValidated ? (isCorrect ? 'exercise-input-correct' : 'exercise-input-incorrect') : ''}`}
                />
                {isValidated && !isCorrect && errorMessage && (
                  <Box sx={{fontSize: '0.75rem',
                    color: '#d32f2f',
                    marginTop: 4,
                    maxWidth: 200,
                    wordWrap: 'break-word'}}>
                    {errorMessage}
                  </Box>
                )}
              </Stack>
            );
          }
        })}
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
