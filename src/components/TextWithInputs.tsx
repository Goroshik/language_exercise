import HistoryIcon from '@mui/icons-material/History';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';

import { useTextSelection } from 'src/hooks/useTextSelection';
import { useAlertStore } from 'src/store/alertStore';
import { useAppStore } from 'src/store/appStore';
import type { TranslationPanelState } from 'src/types/translation';
import TextSelectionPopover from './TextSelectionPopover';
import WordTranslationPanel from './WordTranslationPanel';

interface TextWithInputsProps {
  text: string;
  exerciseIndex?: string | number;
  sentenceId?: string;
  hasAnswer?: boolean; // флаг наличия предыдущего ответа
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
  hasAnswer = false,
  validationResults = {}
}) => {
  const [textareaValue, setTextareaValue] = useState('');
  const [doubleClickTranslationPanel, setDoubleClickTranslationPanel] =
    useState<TranslationPanelState | null>(null);

  // Get savedAnswers from store
  const savedAnswers = useAppStore(state => state.savedAnswers);

  // Use the text selection hook for multiword translation
  const {
    selectionPopover,
    translationPanel: selectionTranslationPanel,
    handleSelectionPopoverTranslate,
    closeSelectionPopover,
    closeTranslationPanel: closeSelectionTranslationPanel
  } = useTextSelection();
  const [isLoadingPreviousAnswer, setIsLoadingPreviousAnswer] = useState(false);

  const { addAlert } = useAlertStore();

  const textareaId = `textarea_${exerciseIndex}`;

  const parsedContent = useMemo(() => parseExerciseContent(text), [text]);
  const { displaySentence, prefillSentence, hints, translation, additionalNotes } = parsedContent;

  // Load saved answer from store when component mounts or sentenceId changes
  useEffect(() => {
    if (sentenceId && savedAnswers[sentenceId]) {
      setTextareaValue(savedAnswers[sentenceId]);
    } else if (!sentenceId) {
      // Reset when there's no sentenceId (new exercise)
      setTextareaValue('');
    }
  }, [sentenceId, savedAnswers]);

  const handlePrefillClick = () => {
    if (textareaValue.trim().length > 0 || !prefillSentence) {
      return;
    }
    setTextareaValue(prefillSentence);
  };

  const handleLoadPreviousAnswer = async () => {
    if (!sentenceId || isLoadingPreviousAnswer) {
      return;
    }

    try {
      setIsLoadingPreviousAnswer(true);

      const response = await fetch(`/api/user-answers?sentenceIds=${sentenceId}`);
      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        const previousAnswer = result.data[0].answer;
        setTextareaValue(previousAnswer);
        addAlert('Предыдущий ответ загружен', 'success');
      } else {
        // No previous answer found
        addAlert('Предыдущий ответ не найден', 'warning');
      }
    } catch (error) {
      console.error('Error loading previous answer:', error);
      addAlert('Ошибка при загрузке предыдущего ответа', 'error');
    } finally {
      setIsLoadingPreviousAnswer(false);
    }
  };

  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    setTextareaValue(newValue);
    
    // Update savedAnswers in store immediately for instant switching between blocks
    if (sentenceId && typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const store = (window as any).__appStore;
      if (store?.setState) {
        const currentSavedAnswers = store.getState().savedAnswers;
        store.setState({ savedAnswers: { ...currentSavedAnswers, [sentenceId]: newValue } });
      }
    }
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

      setDoubleClickTranslationPanel({
        word: cleanWord.toLowerCase(),
        position
      });
    }
  };

  const handleCloseDoubleClickTranslationPanel = () => {
    setDoubleClickTranslationPanel(null);
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
          />

          <Stack
            direction="row"
            spacing={1}
            sx={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              zIndex: 10
            }}
          >
            {sentenceId && hasAnswer && (
              <Button
                variant="outlined"
                size="small"
                onClick={handleLoadPreviousAnswer}
                disabled={isLoadingPreviousAnswer}
                startIcon={<HistoryIcon />}
                sx={{
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  minWidth: 'auto'
                }}
              >
                {isLoadingPreviousAnswer ? 'Загрузка...' : 'Пред. ответ'}
              </Button>
            )}

            <Button
              variant="outlined"
              size="small"
              onClick={handlePrefillClick}
              disabled={isPrefillDisabled}
              sx={{
                textTransform: 'none',
                whiteSpace: 'nowrap',
                minWidth: 'auto'
              }}
            >
              Предзаполнить
            </Button>
          </Stack>
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
          key={selectionTranslationPanel.word}
          word={selectionTranslationPanel.word}
          position={selectionTranslationPanel.position}
          onClose={closeSelectionTranslationPanel}
        />
      )}

      {/* Translation panel from double-click */}
      {doubleClickTranslationPanel && (
        <WordTranslationPanel
          key={doubleClickTranslationPanel.word}
          word={doubleClickTranslationPanel.word}
          position={doubleClickTranslationPanel.position}
          onClose={handleCloseDoubleClickTranslationPanel}
        />
      )}
    </>
  );
};

export default TextWithInputs;
