'use client';

import { Close as CloseIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  TextField,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
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
}

const ImportWordsModal: React.FC<ImportWordsModalProps> = ({
  open,
  onClose,
  preFilledWord,
  preFilledTranslate
}) => {
  const [step, setStep] = useState<'input' | 'parsing' | 'review'>('input');
  const [inputText, setInputText] = useState('');
  const [parsedWords, setParsedWords] = useState<ParsedWord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Manual parsing fallback for common text formats
  const parseTextManually = (text: string): ParsedWord[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const parsed: ParsedWord[] = [];

    for (const line of lines) {
      // Try different separators: -, :, =, tab
      const separators = [' - ', ' : ', ' = ', '\t'];
      let matched = false;

      for (const separator of separators) {
        if (line.includes(separator)) {
          const [word, translate] = line.split(separator).map(s => s.trim());
          if (word && translate) {
            parsed.push({ word, translate });
            matched = true;
            break;
          }
        }
      }

      // If no separator found, check for just spaces (two words)
      if (!matched) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          // Take first word as source, rest as translation
          const word = parts[0];
          const translate = parts.slice(1).join(' ');
          if (word && translate) {
            parsed.push({ word, translate });
          }
        }
      }
    }

    return parsed;
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
        setStep('review');
      }
    }
  }, [open, preFilledWord, preFilledTranslate]);

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

      const data = await response.json();

      if (response.ok && data.success && data.data && data.data.length > 0) {
        const parsed: ParsedWord[] = data.data.map((item: ParsedWord) => ({
          word: item.word || '',
          translate: item.translate || ''
        }));
        setParsedWords(parsed);
        setStep('review');
        setIsLoading(false);
        return;
      }

      // If AI parsing failed or returned no results, fall back to manual parsing
      throw new Error(data.error || 'AI parsing returned no results');
    } catch (error) {
      console.log('AI parsing failed, attempting manual parsing:', error);

      // Fallback to manual parsing
      try {
        const manuallyParsed = parseTextManually(inputText);

        if (manuallyParsed.length > 0) {
          setParsedWords(manuallyParsed);
          setStep('review');
          showAlert.warning(
            `Использован ручной парсинг. Найдено слов: ${manuallyParsed.length}. Проверьте результаты.`
          );
        } else {
          showAlert.error(
            'Не удалось распознать слова в тексте. Используйте формат: "word - translation"'
          );
          setStep('input');
        }
      } catch (manualError) {
        console.error('Manual parsing failed:', manualError);
        showAlert.error('Ошибка при обработке текста. Проверьте формат ввода.');
        setStep('input');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportWords = async () => {
    setIsLoading(true);
    try {
      await addWords(parsedWords);
      showAlert.success(`Успешно добавлено слов: ${parsedWords.length}`);
      handleClose();
    } catch (error) {
      console.error('Error importing words:', error);
      showAlert.error('Ошибка при добавлении слов');
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
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {step === 'input' && 'Импорт слов из текста'}
          {step === 'parsing' && 'Обработка текста...'}
          {step === 'review' && 'Проверка и редактирование'}
        </Typography>
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
              </Typography>
              <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
                {parsedWords.map((word, index) => (
                  <ListItem key={index} divider>
                    <Box width="100%">
                      <Box display="flex" gap={2} mb={1}>
                        <TextField
                          size="small"
                          label="Слово"
                          value={word.word}
                          onChange={e => updateParsedWord(index, 'word', e.target.value)}
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          size="small"
                          label="Перевод"
                          value={word.translate}
                          onChange={e => updateParsedWord(index, 'translate', e.target.value)}
                          sx={{ flex: 1 }}
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
              disabled={parsedWords.length === 0 || isLoading}
            >
              {isLoading ? <CircularProgress size={20} /> : `Добавить ${parsedWords.length} слов`}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ImportWordsModal;
