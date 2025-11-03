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
import React, { useEffect, useState } from 'react';
import { useSettingsStore } from 'src/store/settingsStore';
import { showAlert } from 'src/utils/alert';

interface ImportWordsModalProps {
  open: boolean;
  onClose: () => void;
  preFilledWord?: string;
  preFilledTranslate?: string;
}

interface ParsedWord {
  word: string;
  translate: string;
  isDuplicate?: boolean;
}

const ImportWordsModal: React.FC<ImportWordsModalProps> = ({
  open,
  onClose,
  preFilledWord,
  preFilledTranslate
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [step, setStep] = useState<'input' | 'parsing' | 'review'>('input');
  const [inputText, setInputText] = useState('');
  const [parsedWords, setParsedWords] = useState<ParsedWord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { settings } = useSettingsStore();

  // Get display name for the learning language
  const getLanguageDisplayName = () => {
    const languageCode = settings?.learningLanguage || 'en';
    const languageNames: Record<string, string> = {
      en: 'Английский',
      pl: 'Польский',
      de: 'Немецкий',
      fr: 'Французский',
      es: 'Испанский',
      it: 'Итальянский'
    };
    return languageNames[languageCode] || languageCode.toUpperCase();
  };

  const addWords = async (words: ParsedWord[]) => {
    const response = await fetch('/api/dictionary/words', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ words })
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to add words');
    }

    return data.word;
  };

  useEffect(() => {
    if (open) {
      // NOTE: Pre-fill the form if word and translation are provided
      if (preFilledWord && preFilledTranslate) {
        const preFilledParsedWord: ParsedWord = {
          word: preFilledWord,
          translate: preFilledTranslate
        };
        setParsedWords([preFilledParsedWord]);
        // NOTE: Check for duplicates on server side
        checkPrefilledWordDuplicate(preFilledParsedWord);
        setStep('review');
      }
    }
  }, [open, preFilledWord, preFilledTranslate]);

  const checkPrefilledWordDuplicate = async (word: ParsedWord) => {
    try {
      const response = await fetch('/api/dictionary/words/check-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ words: [word.word] })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.duplicates && data.duplicates[0]) {
        setParsedWords([{ ...word, isDuplicate: true }]);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error checking duplicates:', message);
    }
  };

  const handleClose = () => {
    setStep('input');
    setInputText('');
    setParsedWords([]);
    onClose();
  };

  const handleParseText = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setStep('parsing');

    try {
      // NOTE: Use API endpoint to parse text into words
      const response = await fetch('/api/ai/parse-words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: inputText })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      // NOTE: Server returns { words: [...] } format with isDuplicate flags
      if (data.words && data.words.length > 0) {
        const parsed: ParsedWord[] = data.words.map((item: ParsedWord) => ({
          word: item.word || '',
          translate: item.translate || '',
          isDuplicate: item.isDuplicate || false
        }));
        setParsedWords(parsed);
        setStep('review');
        return;
      }

      // NOTE: Fallback to manual parsing if AI returns no results
      throw new Error('AI parsing returned no results');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showAlert.error(`Error parsing text with AI: ${message}`);
      // NOTE: Fallback manual parsing for demo
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportWords = async () => {
    setIsLoading(true);
    try {
      const wordsToAdd = parsedWords.filter(word => !word.isDuplicate);
      if (wordsToAdd.length === 0) {
        showAlert.error('Все слова уже существуют в словаре');
        return;
      }
      await addWords(wordsToAdd.map(({ word, translate }) => ({ word, translate })));
      handleClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showAlert.error(`Error importing words: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateParsedWord = (index: number, field: 'word' | 'translate', value: string) => {
    setParsedWords(prev =>
      prev.map((word, i) => (i === index ? { ...word, [field]: value } : word))
    );
  };

  const removeParsedWord = (index: number) => {
    setParsedWords(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          height: isMobile ? '100%' : '80vh',
          maxHeight: isMobile ? '100%' : '80vh'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h6">
            {step === 'input' && 'Импорт слов из текста'}
            {step === 'parsing' && 'Обработка текста...'}
            {step === 'review' && 'Проверка и редактирование'}
          </Typography>
          <Chip
            icon={<LanguageIcon />}
            label={getLanguageDisplayName()}
            color="primary"
            size="small"
          />
        </Box>
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', gap: 2, p: 2 }}>
        {/* Main content area */}
        <Box flex="1" sx={{ pr: 2 }}>
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
            <Box display="flex" justifyContent="center" alignItems="center" height="400px">
              <Box textAlign="center">
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6">Обработка текста...</Typography>
                <Typography color="text.secondary">Пожалуйста, подождите</Typography>
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
                    color="warning.main"
                    sx={{ ml: 2, fontSize: '0.9rem' }}
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
                    <Box width="100%">
                      <Box display="flex" gap={2} mb={1} alignItems="center">
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

      <DialogActions sx={{ p: 2, gap: 1 }}>
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
            <Button onClick={() => setStep('input')}>Назад</Button>
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
