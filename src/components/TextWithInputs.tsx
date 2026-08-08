import HistoryIcon from '@mui/icons-material/History';
import { Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useTextSelection } from 'src/hooks/useTextSelection';
import { useAlertStore } from 'src/store/alertStore';
import { useAppStore } from 'src/store/appStore';
import type { TranslationPanelState } from 'src/types/translation';
import { cleanWord, extractWordAtOffset, parseExerciseContent } from 'src/utils/exerciseContent';
import TextSelectionPopover from './TextSelectionPopover';
import WordTranslationPanel from './WordTranslationPanel';

interface TextWithInputsProps {
  text: string;
  exerciseIndex?: string | number | undefined;
  sentenceId?: string | undefined;
  hasAnswer?: boolean | undefined;
  validationResults?:
    | {
        [key: string]: {
          isCorrect: boolean;
          error?: string | undefined;
          incorrectTranslations?: string[] | undefined;
        };
      }
    | undefined;
}

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

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const savedAnswers = useAppStore(state => state.savedAnswers);

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

  useEffect(() => {
    if (sentenceId && savedAnswers[sentenceId]) {
      setTextareaValue(savedAnswers[sentenceId]);
    } else if (!sentenceId) {
      setTextareaValue('');
    }
  }, [sentenceId, savedAnswers]);

  const handlePrefillClick = useCallback(() => {
    if (textareaValue.trim().length > 0 || !prefillSentence) {
      return;
    }
    setTextareaValue(prefillSentence);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const blankIndex = prefillSentence.indexOf('_____');
        if (blankIndex !== -1) {
          textareaRef.current.setSelectionRange(blankIndex, blankIndex + 5);
        }
      }
    }, 0);
  }, [textareaValue, prefillSentence]);

  const handleLoadPreviousAnswer = useCallback(async () => {
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
        addAlert('Предыдущий ответ не найден', 'warning');
      }
    } catch (error) {
      console.error('Error loading previous answer:', error);
      addAlert('Ошибка при загрузке предыдущего ответа', 'error');
    } finally {
      setIsLoadingPreviousAnswer(false);
    }
  }, [sentenceId, isLoadingPreviousAnswer, addAlert]);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTextareaChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      setTextareaValue(newValue);

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      if (sentenceId && typeof window !== 'undefined') {
        saveTimeoutRef.current = setTimeout(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const store = (window as any).__appStore;
          if (store?.setState) {
            const currentSavedAnswers = store.getState().savedAnswers;
            store.setState({ savedAnswers: { ...currentSavedAnswers, [sentenceId]: newValue } });
          }
        }, 150);
      }
    },
    [sentenceId]
  );

  const handleTextareaBlur = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (sentenceId && textareaValue.trim() && typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const store = (window as any).__appStore;
      if (store?.setState && store?.getState) {
        const currentSavedAnswers = store.getState().savedAnswers;
        store.setState({ savedAnswers: { ...currentSavedAnswers, [sentenceId]: textareaValue } });

        const { saveAnswer } = store.getState();
        if (saveAnswer) {
          saveAnswer(sentenceId, textareaValue);
        }
      }
    }
  }, [sentenceId, textareaValue]);

  const handleTextDoubleClick = useCallback((event: React.MouseEvent) => {
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

    const word = cleanWord(selectedText);
    if (word) {
      setDoubleClickTranslationPanel({
        word,
        position: { x: event.clientX, y: event.clientY + 10 }
      });
    }
  }, []);

  const lastTapRef = useRef<number>(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMobileTap = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (typeof window === 'undefined') return;

    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isMobile) return;

    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (!(timeSinceLastTap < 300 && timeSinceLastTap > 0)) {
      lastTapRef.current = now;
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
      tapTimeoutRef.current = setTimeout(() => {
        lastTapRef.current = 0;
      }, 300);
      return;
    }

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
    }

    const clientX = 'touches' in event ? event.changedTouches[0]?.clientX || 0 : event.clientX;
    const clientY = 'touches' in event ? event.changedTouches[0]?.clientY || 0 : event.clientY;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const selectedText = selection.toString().trim();
      if (selectedText && selectedText.split(/\s+/).length > 1) {
        return;
      }
      if (selectedText && /^[\p{L}]+$/u.test(selectedText)) {
        setDoubleClickTranslationPanel({
          word: selectedText.toLowerCase(),
          position: { x: clientX, y: clientY + 10 }
        });
        return;
      }
    }

    let wordAtPoint = '';
    if (typeof document !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc = document as any;
      if (doc.caretRangeFromPoint) {
        const range = doc.caretRangeFromPoint(clientX, clientY);
        if (range && range.startContainer.nodeType === 3) {
          wordAtPoint = extractWordAtOffset(
            range.startContainer.textContent || '',
            range.startOffset
          );
        }
      } else if (doc.caretPositionFromPoint) {
        const caretPos = doc.caretPositionFromPoint(clientX, clientY);
        if (caretPos && caretPos.offsetNode.nodeType === 3) {
          wordAtPoint = extractWordAtOffset(caretPos.offsetNode.textContent || '', caretPos.offset);
        }
      }
    }

    const word = cleanWord(wordAtPoint);
    if (word) {
      setDoubleClickTranslationPanel({
        word,
        position: { x: clientX, y: clientY + 10 }
      });
    }
  }, []);

  const handleCloseDoubleClickTranslationPanel = useCallback(() => {
    setDoubleClickTranslationPanel(null);
  }, []);

  const validationResult = validationResults[textareaId];
  const isValidated = Boolean(validationResult);
  const isCorrect = Boolean(validationResult?.isCorrect);
  const errorMessage = validationResult?.error;
  const incorrectTranslations = validationResult?.incorrectTranslations;

  const isPrefillDisabled = textareaValue.trim().length > 0 || !prefillSentence;

  return (
    <>
      <Stack
        sx={{
          gap: 2,
          width: '100%'
        }}
      >
        <Stack
          onDoubleClick={handleTextDoubleClick}
          onTouchEnd={handleMobileTap}
          onClick={handleMobileTap}
          sx={{
            gap: 1,
            color: '#333'
          }}
        >
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
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#777', fontWeight: 500 }}>
                Подсказка:
              </Typography>
              {hints.map((hint, index) => (
                <Chip
                  key={index}
                  label={hint}
                  size="small"
                  variant="outlined"
                  sx={{
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    borderColor: 'rgba(25, 118, 210, 0.3)',
                    color: '#1976d2',
                    fontWeight: 500,
                    cursor: 'text',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.12)'
                    }
                  }}
                />
              ))}
            </Box>
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
            inputRef={textareaRef}
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

      {selectionPopover && (
        <TextSelectionPopover
          position={selectionPopover.position}
          onTranslate={handleSelectionPopoverTranslate}
          onClose={closeSelectionPopover}
        />
      )}

      {selectionTranslationPanel && (
        <WordTranslationPanel
          key={selectionTranslationPanel.word}
          word={selectionTranslationPanel.word}
          position={selectionTranslationPanel.position}
          onClose={closeSelectionTranslationPanel}
        />
      )}

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
