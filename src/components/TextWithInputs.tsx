import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';

import WordTranslationPanel from './WordTranslationPanel';

interface TextWithInputsProps {
  text: string;
  exerciseIndex?: string | number;
  sentenceId?: string;
  validationResults?: {
    [key: string]: { isCorrect: boolean; error?: string; incorrectTranslations?: string[] };
  };
}

interface ParsedExerciseContent {
  displaySentence: string;
  prefillSentence: string;
  hints: string[];
  translation: string | null;
  additionalNotes: string[];
}

const PLACEHOLDER_REGEX = /\{\{input\}\}/gi;
// Pattern for bold markdown format (e.g., **word**)
const BOLD_PATTERN = '\\*\\*(.*?)\\*\\*';

const EMPTY_PARSED_CONTENT: ParsedExerciseContent = {
  displaySentence: '',
  prefillSentence: '',
  hints: [],
  translation: null,
  additionalNotes: []
};

const stripTranslationLabel = (value: string) =>
  value.replace(/^(?:перевод|translation)\s*[:−-]?\s*/i, '').trim();

const parseExerciseContent = (rawText: string): ParsedExerciseContent => {
  if (!rawText) {
    return EMPTY_PARSED_CONTENT;
  }

  const normalized = rawText.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return EMPTY_PARSED_CONTENT;
  }

  const withoutNumbering = normalized.replace(/^[\d).*\s-]+/, '').trim();
  const lines = withoutNumbering
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return EMPTY_PARSED_CONTENT;
  }

  let mainLine = lines[0];
  const extraLines = lines.slice(1);

  let translation: string | null = null;
  const dashMatch = mainLine.match(/^(.*?)[\s]*[-–—][\s]*(.+)$/);
  if (dashMatch) {
    mainLine = dashMatch[1].trim();
    translation = stripTranslationLabel(dashMatch[2]);
  }
  // Create a new regex instance to avoid state persistence issues with global regex
  const hasBoldFormat = new RegExp(BOLD_PATTERN).test(mainLine);
  let hints: string[] = [];

  if (hasBoldFormat) {
    const boldWords: string[] = [];
    let match;
    const boldRegex = new RegExp(BOLD_PATTERN, 'g');
    while ((match = boldRegex.exec(mainLine)) !== null) {
      boldWords.push(match[1]);
    }

    const hintMatch = mainLine.match(/\s*\(([^)]+)\)\s*$/);
    if (hintMatch) {
      hints = hintMatch[1]
        .split(/[,;]+/)
        .map(part => part.trim())
        .filter(Boolean);

      mainLine = mainLine.replace(/\s*\([^)]+\)\s*$/, '').trim();
    }

    const displaySentence = mainLine.replace(new RegExp(BOLD_PATTERN, 'g'), '_____');
    const prefillSentence = displaySentence;

    return {
      displaySentence,
      prefillSentence,
      hints,
      translation: translation || null,
      additionalNotes: extraLines
    };
  } else {
    const hintMatch = mainLine.match(/\(([^)]+)\)\s*$/);
    hints = hintMatch
      ? hintMatch[1]
          .split(/[,;]+/)
          .map(part => part.trim())
          .filter(Boolean)
      : [];
    if (hintMatch) {
      mainLine = mainLine.replace(/\s*\([^)]+\)\s*$/, '').trim();
    }

    if (!translation) {
      const translationIndex = extraLines.findIndex(line =>
        /^(?:перевод|translation)\b/i.test(line)
      );
      if (translationIndex !== -1) {
        translation = stripTranslationLabel(extraLines[translationIndex]);
        extraLines.splice(translationIndex, 1);
      } else if (extraLines.length > 0) {
        translation = stripTranslationLabel(extraLines[0]);
        extraLines.shift();
      }
    }

    const displaySentence = mainLine.replace(PLACEHOLDER_REGEX, '_____');
    const prefillSentence = displaySentence;

    return {
      displaySentence,
      prefillSentence,
      hints,
      translation: translation || null,
      additionalNotes: extraLines
    };
  }
};

const TextWithInputs: React.FC<TextWithInputsProps> = ({
  text,
  exerciseIndex = 0,
  sentenceId,
  validationResults = {}
}) => {
  const [textareaValue, setTextareaValue] = useState('');
  const [translationPanel, setTranslationPanel] = useState<{
    word: string;
    position: { x: number; y: number };
  } | null>(null);

  const textareaId = `textarea_${exerciseIndex}`;

  const parsedContent = useMemo(() => parseExerciseContent(text), [text]);
  const { displaySentence, prefillSentence, hints, translation, additionalNotes } = parsedContent;

  // Load saved answer when component mounts or sentenceId changes
  useEffect(() => {
    if (typeof window !== 'undefined' && sentenceId) {
      // Try to get from store first
      // TODO: Fix types - properly type window.__appStore instead of using any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { savedAnswers } = (window as any).__appStore?.getState?.() || {};
      const savedAnswer = savedAnswers?.[sentenceId];
      if (savedAnswer) {
        setTextareaValue(savedAnswer);
      }
    }
  }, [sentenceId]);

  useEffect(() => {
    // Reset when text changes (new exercise)
    if (!sentenceId) {
      setTextareaValue('');
    }
  }, [text, sentenceId]);

  const handlePrefillClick = () => {
    if (textareaValue.trim().length > 0 || !prefillSentence) {
      return;
    }
    setTextareaValue(prefillSentence);
  };

  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    setTextareaValue(newValue);
  };

  const handleTextareaBlur = () => {
    // Save answer to store when textarea loses focus
    if (sentenceId && textareaValue.trim() && typeof window !== 'undefined') {
      // TODO: Fix types - properly type window.__appStore instead of using any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const store = (window as any).__appStore;
      if (store?.getState) {
        const { saveAnswer } = store.getState();
        if (saveAnswer) {
          saveAnswer(sentenceId, textareaValue);
        }
      }
    }
  };

  const handleTextDoubleClick = (event: React.MouseEvent) => {
    if (typeof window === 'undefined') return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    let selectedText = range.toString().trim();

    if (!selectedText) {
      const target = event.target as HTMLElement;
      const clickedText = target.textContent || '';
      const clickOffset = range.startOffset;
      const words = clickedText.split(/\s+/);
      let currentOffset = 0;

      for (const word of words) {
        const wordEnd = currentOffset + word.length;
        if (clickOffset >= currentOffset && clickOffset <= wordEnd) {
          selectedText = word;
          break;
        }
        currentOffset = wordEnd + 1;
      }
    }

    const cleanWord = selectedText.replace(/[^\w]/g, '');

    if (cleanWord && /^[a-zA-Z]+$/.test(cleanWord)) {
      const position = {
        x: event.clientX,
        y: event.clientY + 10
      };

      setTranslationPanel({
        word: cleanWord.toLowerCase(),
        position
      });
    }
  };

  const handleCloseTranslationPanel = () => {
    setTranslationPanel(null);
  };

  const validationResult = validationResults[textareaId];
  const isValidated = Boolean(validationResult);
  const isCorrect = Boolean(validationResult?.isCorrect);
  const errorMessage = validationResult?.error;
  const incorrectTranslations = validationResult?.incorrectTranslations;

  const isPrefillDisabled = textareaValue.trim().length > 0 || !prefillSentence;

  return (
    <>
      <Stack gap={2} sx={{ width: '100%' }}>
        <Stack gap={1} sx={{ color: '#333' }} onDoubleClick={handleTextDoubleClick}>
          {displaySentence && (
            <Typography
              variant="body1"
              sx={{ fontWeight: 500, lineHeight: 1.6, whiteSpace: 'pre-wrap', cursor: 'text' }}
            >
              {displaySentence}
            </Typography>
          )}

          {additionalNotes.map((note, index) => (
            <Typography
              key={`note-${index}`}
              variant="body2"
              sx={{ color: '#555', whiteSpace: 'pre-wrap' }}
            >
              {note}
            </Typography>
          ))}

          {hints.length > 0 && (
            <Typography
              variant="caption"
              sx={{ color: '#777', whiteSpace: 'pre-wrap', cursor: 'text' }}
            >
              Подсказка: {hints.join(', ')}
            </Typography>
          )}

          {translation && (
            <Typography
              variant="body2"
              sx={{ color: '#666', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}
            >
              {translation}
            </Typography>
          )}
        </Stack>

        <Box sx={{ position: 'relative', width: '100%' }}>
          <TextField
            id={textareaId}
            multiline
            minRows={4}
            fullWidth
            variant="outlined"
            value={textareaValue}
            onChange={handleTextareaChange}
            onBlur={handleTextareaBlur}
            placeholder="Введите ваш ответ здесь..."
            className={`exercise-input ${
              isValidated ? (isCorrect ? 'exercise-input-correct' : 'exercise-input-incorrect') : ''
            }`}
            sx={{ paddingRight: '120px' }}
          />

          <Button
            variant="outlined"
            size="small"
            onClick={handlePrefillClick}
            disabled={isPrefillDisabled}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              textTransform: 'none',
              whiteSpace: 'nowrap',
              minWidth: 'auto',
              zIndex: 10
            }}
          >
            Предзаполнить
          </Button>
        </Box>

        {isValidated && !isCorrect && errorMessage && (
          <Box
            sx={{
              fontSize: '0.875rem',
              color: '#d32f2f',
              padding: 1,
              backgroundColor: '#ffebee',
              borderRadius: 1,
              '& strong': {
                fontWeight: 700
              }
            }}
            dangerouslySetInnerHTML={{
              __html: errorMessage.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            }}
          />
        )}

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
      </Stack>

      {translationPanel && (
        <WordTranslationPanel
          key={translationPanel.word}
          word={translationPanel.word}
          position={translationPanel.position}
          onClose={handleCloseTranslationPanel}
        />
      )}
    </>
  );
};

export default TextWithInputs;
