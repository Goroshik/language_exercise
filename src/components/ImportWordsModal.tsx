'use client';

import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { DEFAULT_LANGUAGE_CODE, languageLabel } from 'src/constants/languages';
import { addWords, isDuplicateWord, parseWordsFromText } from 'src/services/wordsClient';
import { useSettingsStore } from 'src/store/settingsStore';
import { showAlert } from 'src/utils/alert';
import {
  type ImportStep,
  type ParsedWord,
  describeFailure,
  markDuplicate,
  removeWordAt,
  updateWordAt,
  wordsToImport
} from 'src/utils/wordImport';

interface ImportWordsModalProps {
  open: boolean;
  onClose: () => void;
  preFilledWord?: string;
  preFilledTranslate?: string;
}

const ImportWordsModal: React.FC<ImportWordsModalProps> = ({
  open,
  onClose,
  preFilledWord,
  preFilledTranslate
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [step, setStep] = useState<ImportStep>('input');
  const [inputText, setInputText] = useState('');
  const [parsedWords, setParsedWords] = useState<ParsedWord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { settings } = useSettingsStore();

  const languageDisplayName = languageLabel(settings?.learningLanguage || DEFAULT_LANGUAGE_CODE);
  const backToInput = () => setStep('input');

  // Prefilled from the translation panel: review at once, flag afterwards.
  useEffect(() => {
    if (!open || !preFilledWord || !preFilledTranslate) return;

    const entry: ParsedWord = { word: preFilledWord, translate: preFilledTranslate };
    setParsedWords([entry]);
    setStep('review');

    isDuplicateWord(entry.word)
      .then(duplicate => {
        if (duplicate) setParsedWords(markDuplicate(entry, true));
      })
      .catch(error => console.error('Error checking duplicates:', describeFailure(error)));
  }, [open, preFilledWord, preFilledTranslate]);

  const handleClose = useCallback(() => {
    setStep('input');
    setInputText('');
    setParsedWords([]);
    onClose();
  }, [onClose]);

  const handleParseText = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setStep('parsing');

    try {
      setParsedWords(await parseWordsFromText(inputText));
      setStep('review');
    } catch (error) {
      showAlert.error(`Error parsing text with AI: ${describeFailure(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportWords = async () => {
    setIsLoading(true);

    try {
      const toAdd = wordsToImport(parsedWords);
      if (toAdd.length === 0) {
        showAlert.error('Все слова уже существуют в словаре');
        return;
      }

      await addWords(toAdd);
      handleClose();
    } catch (error) {
      showAlert.error(`Error importing words: ${describeFailure(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateParsedWord = (index: number, field: 'word' | 'translate', value: string) =>
    setParsedWords(prev => updateWordAt(prev, index, field, value));

  const removeParsedWord = (index: number) => setParsedWords(prev => removeWordAt(prev, index));

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      slotProps={{
        paper: {
          sx: {
            ...(isMobile
              ? {
                  margin: 0,
                  maxHeight: '100vh',
                  height: '100vh',
                  borderRadius: 0,
                  display: 'flex',
                  flexDirection: 'column'
                }
              : {
                  height: '80vh',
                  maxHeight: '80vh',
                  display: 'flex',
                  flexDirection: 'column'
                })
          }
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          px: isMobile ? 2 : 3,
          pb: isMobile ? 1 : 2
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Typography variant="h6">
            {step === 'input' && 'Импорт слов из текста'}
            {step === 'parsing' && 'Обработка текста...'}
            {step === 'review' && 'Проверка и редактирование'}
          </Typography>
          <Chip icon={<LanguageIcon />} label={languageDisplayName} color="primary" size="small" />
        </Box>
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          display: 'flex',
          gap: 2,
          p: isMobile ? 1.5 : 2,
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        {/* Main content area */}
        <Box
          sx={{
            flex: '1',
            pr: 2
          }}
        >
          {step === 'input' && (
            <TextField
              fullWidth
              multiline
              rows={16}
              placeholder="Введите текст для импорта слов. Например:
apple - яблоко
book - книга
cat - кот"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              sx={{
                '& .MuiInputBase-root': {
                  height: '100%',
                  alignItems: 'flex-start'
                }
              }}
            />
          )}

          {step === 'parsing' && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '400px'
              }}
            >
              <Box
                sx={{
                  textAlign: 'center'
                }}
              >
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6">Обработка текста...</Typography>
                <Typography
                  sx={{
                    color: 'text.secondary'
                  }}
                >
                  Пожалуйста, подождите
                </Typography>
              </Box>
            </Box>
          )}

          {step === 'review' && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Найдено слов: {parsedWords.length}
                {parsedWords.some(w => w.isDuplicate) && (
                  <Typography
                    component="span"
                    sx={{
                      color: 'warning.main',
                      ml: 2,
                      fontSize: '0.9rem'
                    }}
                  >
                    (дубликаты: {parsedWords.filter(w => w.isDuplicate).length})
                  </Typography>
                )}
              </Typography>
              <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
                {parsedWords.map((word, index) => (
                  <ListItem
                    key={index}
                    divider
                    sx={{
                      border: word.isDuplicate ? '3px solid' : 'none',
                      borderColor: word.isDuplicate ? 'warning.main' : 'transparent',
                      borderRadius: 1,
                      mb: word.isDuplicate ? 1 : 0,
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <Box
                      sx={{
                        width: '100%'
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 2,
                          mb: 1,
                          alignItems: 'center'
                        }}
                      >
                        {word.isDuplicate && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'warning.dark',
                              fontWeight: 'bold',
                              minWidth: '80px'
                            }}
                          >
                            Дубликат
                          </Typography>
                        )}
                        <TextField
                          size="small"
                          label="Слово"
                          value={word.word}
                          onChange={e => updateParsedWord(index, 'word', e.target.value)}
                          sx={{ flex: 1 }}
                          disabled={word.isDuplicate}
                        />
                        <TextField
                          size="small"
                          label="Перевод"
                          value={word.translate}
                          onChange={e => updateParsedWord(index, 'translate', e.target.value)}
                          sx={{ flex: 1 }}
                          disabled={word.isDuplicate}
                        />
                        <IconButton size="small" onClick={() => removeParsedWord(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: isMobile ? 1.5 : 2,
          gap: 1,
          flexShrink: 0
        }}
      >
        {step === 'input' && (
          <>
            <Button onClick={handleClose}>Отмена</Button>
            <Button
              variant="contained"
              onClick={handleParseText}
              disabled={!inputText.trim() || isLoading}
            >
              Импорт
            </Button>
          </>
        )}

        {step === 'review' && (
          <>
            <Button onClick={backToInput}>Назад</Button>
            <Button onClick={handleClose}>Отмена</Button>
            <Button
              variant="contained"
              onClick={handleImportWords}
              disabled={parsedWords.filter(w => !w.isDuplicate).length === 0 || isLoading}
            >
              {isLoading ? (
                <CircularProgress size={20} />
              ) : (
                `Добавить ${parsedWords.filter(w => !w.isDuplicate).length} слов`
              )}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ImportWordsModal;
