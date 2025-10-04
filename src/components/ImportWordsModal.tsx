'use client'

import React, {useCallback, useEffect, useState} from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import {Add as AddIcon, Close as CloseIcon, Delete as DeleteIcon} from '@mui/icons-material';

interface ImportWordsModalProps {
  open: boolean;
  onClose: () => void;
  preFilledWord?: string;
  preFilledTranslate?: string;
}

interface ParsedWord {
  word: string;
  translate: string;
  tags: string[];
}

const ImportWordsModal: React.FC<ImportWordsModalProps> = ({open, onClose, preFilledWord, preFilledTranslate}) => {
  const [step, setStep] = useState<'input' | 'parsing' | 'review'>('input');
  const [inputText, setInputText] = useState('');
  const [parsedWords, setParsedWords] = useState<ParsedWord[]>([]);
  const [selectedGlobalTags, setSelectedGlobalTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);

  const loadAllTags = useCallback(async () => {
    try {
      const response = await fetch('/api/dictionary/tags');
      const data = await response.json();

      if (data.success) {
        setAllTags(data.tags);
      }
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }, []);

  const saveTags = async (tags: string[]) => {
    try {
      const response = await fetch('/api/dictionary/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({tags}),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save tags');
      }

      // Update local tags with response
      if (data.tags) {
        setAllTags(data.tags);
      }
    } catch (error) {
      console.error('Failed to save tags:', error);
      throw error;
    }
  };

  const addWord = async (word: string, translate: string, tags: string[]) => {
    const response = await fetch('/api/dictionary/words', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({word, translate, tags}),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to add word');
    }

    // Update allTags if new tags were added
    if (data.allTags) {
      setAllTags(data.allTags);
    }

    return data.word;
  };

  useEffect(() => {
    if (open) {
      loadAllTags();
      // NOTE: Pre-fill the form if word and translation are provided
      if (preFilledWord && preFilledTranslate) {
        const preFilledParsedWord: ParsedWord = {
          word: preFilledWord,
          translate: preFilledTranslate,
          tags: [...selectedGlobalTags]
        };
        setParsedWords([preFilledParsedWord]);
        setStep('review');
      }
    }
  }, [open, loadAllTags, preFilledWord, preFilledTranslate, selectedGlobalTags]);

  const handleClose = () => {
    setStep('input');
    setInputText('');
    setParsedWords([]);
    setSelectedGlobalTags([]);
    setNewTagName('');
    onClose();
  };

  const handleAddNewTag = async () => {
    if (newTagName.trim() && !allTags.includes(newTagName.trim())) {
      const updatedTags = [...allTags, newTagName.trim()];
      await saveTags(updatedTags);
      await loadAllTags();
      setNewTagName('');
    }
  };

  const handleGlobalTagToggle = (tag: string) => {
    setSelectedGlobalTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleWordTagToggle = (wordIndex: number, tag: string) => {
    setParsedWords(prev => prev.map((word, index) => {
      if (index === wordIndex) {
        const wordTags = word.tags.includes(tag)
          ? word.tags.filter(t => t !== tag)
          : [...word.tags, tag];
        return {...word, tags: wordTags};
      }
      return word;
    }));
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
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({text: inputText}),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        const parsed: ParsedWord[] = data.data.map((item: any) => ({
          word: item.word || '',
          translate: item.translate || '',
          tags: [...selectedGlobalTags]
        }));
        setParsedWords(parsed);
        setStep('review');
        return;
      }

      // NOTE: Fallback to manual parsing if AI returns no results
      throw new Error('AI parsing returned no results');
    } catch (error) {
      console.error('Error parsing text with AI:', error);
      // NOTE: Fallback manual parsing for demo
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportWords = async () => {
    setIsLoading(true);
    try {
      for (const parsedWord of parsedWords) {
        if (parsedWord.word.trim() && parsedWord.translate.trim()) {
          await addWord(parsedWord.word.trim(), parsedWord.translate.trim(), parsedWord.tags);
        }
      }
      handleClose();
    } catch (error) {
      console.error('Error importing words:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateParsedWord = (index: number, field: 'word' | 'translate', value: string) => {
    setParsedWords(prev => prev.map((word, i) =>
      i === index ? {...word, [field]: value} : word
    ));
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
      <DialogTitle sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <Typography variant="h6">
          {step === 'input' && 'Импорт слов из текста'}
          {step === 'parsing' && 'Обработка текста...'}
          {step === 'review' && 'Проверка и редактирование'}
        </Typography>
        <IconButton onClick={handleClose}>
          <CloseIcon/>
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{display: 'flex', gap: 2, p: 2}}>
        {/* Main content area */}
        <Box flex="1" sx={{pr: 2}}>
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
              onChange={(e) => setInputText(e.target.value)}
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
                <CircularProgress size={60} sx={{mb: 2}}/>
                <Typography variant="h6">Обработка текста...</Typography>
                <Typography color="text.secondary">
                  Пожалуйста, подождите
                </Typography>
              </Box>
            </Box>
          )}

          {step === 'review' && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Найдено слов: {parsedWords.length}
              </Typography>
              <List sx={{maxHeight: '400px', overflow: 'auto'}}>
                {parsedWords.map((word, index) => (
                  <ListItem key={index} divider>
                    <Box width="100%">
                      <Box display="flex" gap={2} mb={1}>
                        <TextField
                          size="small"
                          label="Слово"
                          value={word.word}
                          onChange={(e) => updateParsedWord(index, 'word', e.target.value)}
                          sx={{flex: 1}}
                        />
                        <TextField
                          size="small"
                          label="Перевод"
                          value={word.translate}
                          onChange={(e) => updateParsedWord(index, 'translate', e.target.value)}
                          sx={{flex: 1}}
                        />
                        <IconButton size="small" onClick={() => removeParsedWord(index)}>
                          <DeleteIcon/>
                        </IconButton>
                      </Box>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {allTags.map(tag => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant={word.tags.includes(tag) ? 'filled' : 'outlined'}
                            onClick={() => handleWordTagToggle(index, tag)}
                            sx={{cursor: 'pointer'}}
                          />
                        ))}
                      </Box>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>

        {/* Tags sidebar */}
        <Paper sx={{width: 250, p: 2, height: 'fit-content'}}>
          <Typography variant="h6" gutterBottom>
            Теги
          </Typography>

          <Box mb={2}>
            <Box display="flex" gap={1} mb={1}>
              <TextField
                size="small"
                placeholder="Новый тег"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddNewTag()}
                sx={{flex: 1}}
              />
              <Button
                size="small"
                variant="outlined"
                onClick={handleAddNewTag}
                disabled={!newTagName.trim()}
              >
                <AddIcon fontSize="small"/>
              </Button>
            </Box>
          </Box>

          <Divider sx={{mb: 2}}/>

          <Typography variant="subtitle2" gutterBottom>
            Применить ко всем словам:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
            {allTags.map(tag => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                variant={selectedGlobalTags.includes(tag) ? 'filled' : 'outlined'}
                onClick={() => handleGlobalTagToggle(tag)}
                sx={{cursor: 'pointer'}}
              />
            ))}
          </Box>

          <Divider sx={{mb: 2}}/>

          <Typography variant="subtitle2" gutterBottom>
            Все теги:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={0.5}>
            {allTags.map(tag => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions sx={{p: 2, gap: 1}}>
        {step === 'input' && (
          <>
            <Button onClick={handleClose}>
              Отмена
            </Button>
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
            <Button onClick={() => setStep('input')}>
              Назад
            </Button>
            <Button onClick={handleClose}>
              Отмена
            </Button>
            <Button
              variant="contained"
              onClick={handleImportWords}
              disabled={parsedWords.length === 0 || isLoading}
            >
              {isLoading ? <CircularProgress size={20}/> : `Добавить ${parsedWords.length} слов`}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ImportWordsModal;
