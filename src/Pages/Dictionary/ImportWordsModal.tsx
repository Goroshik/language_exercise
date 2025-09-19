import React, {useState, useEffect} from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  Stack,
  Divider,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
} from '@mui/material';
import {Close as CloseIcon, Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon} from '@mui/icons-material';
import {useDictionaryStore} from '../../store/dictionaryStore';
import GoogleAIService from '../../services/googleAI';

interface ImportWordsModalProps {
  open: boolean;
  onClose: () => void;
}

interface ParsedWord {
  word: string;
  translate: string;
  tags: string[];
}

const ImportWordsModal: React.FC<ImportWordsModalProps> = ({open, onClose}) => {
  const [step, setStep] = useState<'input' | 'parsing' | 'review'>('input');
  const [inputText, setInputText] = useState('');
  const [parsedWords, setParsedWords] = useState<ParsedWord[]>([]);
  const [selectedGlobalTags, setSelectedGlobalTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {allTags, saveTags, loadAllTags, addWord} = useDictionaryStore();

  useEffect(() => {
    if (open) {
      loadAllTags();
    }
  }, [open, loadAllTags]);

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
      // NOTE: Use GoogleAI service to parse text into words
      const aiParsedWords = await GoogleAIService.parseWordsFromText(inputText);

      if (aiParsedWords.length > 0) {
        const parsed: ParsedWord[] = aiParsedWords.map(item => ({
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
      const lines = inputText.split('\n').filter(line => line.trim());
      const parsed: ParsedWord[] = lines.map(line => {
        const parts = line.split('-').map(part => part.trim());
        if (parts.length >= 2) {
          return {
            word: parts[0],
            translate: parts.slice(1).join(' - '),
            tags: [...selectedGlobalTags]
          };
        }
        return {
          word: line,
          translate: '',
          tags: [...selectedGlobalTags]
        };
      });
      setParsedWords(parsed);
      setStep('review');
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
          <CloseIcon />
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
                <CircularProgress size={60} sx={{mb: 2}} />
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
                          <DeleteIcon />
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
                <AddIcon fontSize="small" />
              </Button>
            </Box>
          </Box>

          <Divider sx={{mb: 2}} />

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

          <Divider sx={{mb: 2}} />

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
              {isLoading ? <CircularProgress size={20} /> : `Добавить ${parsedWords.length} слов`}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ImportWordsModal;
