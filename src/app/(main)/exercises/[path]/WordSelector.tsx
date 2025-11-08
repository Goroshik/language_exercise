import {
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { DictionaryWord } from 'src/types';
import { showAlert } from 'src/utils/alert';

interface WordSelectorProps {
  selectedWords: DictionaryWord[];
  onWordsChange: (words: DictionaryWord[]) => void;
  maxWords?: number;
  customTopic?: string;
  onTopicChange?: (topic: string) => void;
  sentenceCount?: number;
  onSentenceCountChange?: (count: number) => void;
  mode?: 'student' | 'teacher';
}

const WordSelector: React.FC<WordSelectorProps> = ({
  selectedWords,
  onWordsChange,
  maxWords = 5,
  customTopic = '',
  onTopicChange,
  sentenceCount,
  onSentenceCountChange
}) => {
  const [filterText, setFilterText] = useState('');
  const [words, setWords] = useState<DictionaryWord[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    try {
      const response = await fetch('/api/dictionary/words');
      const data = await response.json();

      if (data.success) {
        const loadedWords: DictionaryWord[] = data.words;
        setWords(loadedWords);
        // Собираем уникальные теги из слов
        const tagSet = new Set<string>();

        setAllTags(Array.from(tagSet).sort());
        setIsInitialized(true);
      }
    } catch (_error) {
      showAlert.error('Failed to load words');
      setIsInitialized(true);
    }
  };

  // Теги вычисляются из загруженных слов, отдельный запрос не нужен

  const getFilteredWords = (searchQuery: string = '') => {
    return words.filter(word => {
      // Filter by tags
      const matchesTags = selectedTags.length === 0;

      // Filter by search query
      const matchesSearch =
        searchQuery === '' ||
        word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        word.translate.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTags && matchesSearch;
    });
  };

  const handleWordToggle = (word: DictionaryWord) => {
    const currentIndex = selectedWords.indexOf(word);
    const newSelectedWords = [...selectedWords];

    if (currentIndex === -1) {
      // Add word if not selected and under limit
      if (selectedWords.length < maxWords) {
        newSelectedWords.push(word);
      }
    } else {
      // Remove word if already selected
      newSelectedWords.splice(currentIndex, 1);
    }

    onWordsChange(newSelectedWords);
  };

  const isWordDisabled = (wordText: string) => {
    return selectedWords.length >= maxWords && !selectedWords.some(w => w.word === wordText);
  };

  // NOTE: Handle tag selection for filtering
  const handleTagToggle = (tag: string) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newSelectedTags);
  };

  // NOTE: Clear all tag filters
  const handleClearFilters = () => {
    setSelectedTags([]);
  };

  // NOTE: Get filtered dictionary words based on search text
  const filteredWords = getFilteredWords(filterText);

  // NOTE: Split words into selected and unselected groups
  // Selected words always appear at the top, regardless of search
  const selectedWordsList = selectedWords.filter(
    word => words.some(w => w.id === word.id) // Ensure selected words are still in the dictionary
  );
  const unselectedWords = filteredWords.filter(word => !selectedWords.some(w => w.id === word.id));

  // Combine: selected words first, then unselected filtered words
  const displayWords = [...selectedWordsList, ...unselectedWords];

  return (
    <Paper
      sx={{
        p: 3,
        maxHeight: { xs: 'none', md: 'calc(100vh - 200px)' },
        overflowY: 'auto',
        width: '100%',
        backgroundColor: '#fafafa'
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        Выберите слова ({selectedWords.length}/{maxWords})
      </Typography>

      {/* NOTE: Tag filtering section */}
      {allTags.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
            Фильтр по тегам:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {allTags.map(tag => (
              <Chip
                key={tag}
                label={tag}
                onClick={() => handleTagToggle(tag)}
                color={selectedTags.includes(tag) ? 'primary' : 'default'}
                variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                size="small"
                sx={{
                  '&:hover': {
                    backgroundColor: selectedTags.includes(tag) ? 'primary.dark' : 'action.hover'
                  }
                }}
              />
            ))}
            {selectedTags.length > 0 && (
              <Chip
                label="Очистить фильтры"
                onClick={handleClearFilters}
                variant="outlined"
                size="small"
                color="secondary"
                sx={{ ml: 1 }}
              />
            )}
          </Stack>
        </Box>
      )}

      <TextField
        fullWidth
        size="small"
        placeholder="Поиск слов..."
        value={filterText}
        onChange={e => setFilterText(e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* NOTE: Display filtered dictionary words */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Selected words section */}
        {selectedWordsList.length > 0 && (
          <>
            <Typography
              variant="caption"
              sx={{
                px: 2,
                py: 1,
                color: 'primary.main',
                fontWeight: 600,
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                borderRadius: 1,
                mb: 1
              }}
            >
              Выбранные слова ({selectedWordsList.length})
            </Typography>
            {selectedWordsList.map((dictionaryWord, index) => (
              <Box key={dictionaryWord.id}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={true}
                      onChange={() => handleWordToggle(dictionaryWord)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', flexDirection: 'column', py: 1 }}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          fontSize: '1rem',
                          color: 'primary.main',
                          lineHeight: 1.2
                        }}
                      >
                        {dictionaryWord.word}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.9rem',
                          color: 'text.secondary',
                          fontStyle: 'italic',
                          mt: 0.5
                        }}
                      >
                        {dictionaryWord.translate}
                      </Typography>
                    </Box>
                  }
                  sx={{
                    margin: 0,
                    width: '100%',
                    py: 1,
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.08)'
                    }
                  }}
                />
                {index < selectedWordsList.length - 1 && (
                  <Box
                    sx={{
                      height: '1px',
                      backgroundColor: 'divider',
                      mx: 2,
                      opacity: 0.3
                    }}
                  />
                )}
              </Box>
            ))}

            {/* Separator between selected and unselected */}
            {unselectedWords.length > 0 && (
              <Box sx={{ my: 2, px: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    display: 'block',
                    mb: 1
                  }}
                >
                  Доступные слова
                </Typography>
                <Box
                  sx={{
                    height: '2px',
                    backgroundColor: 'divider',
                    opacity: 0.5
                  }}
                />
              </Box>
            )}
          </>
        )}

        {/* Unselected words section */}
        {unselectedWords.map((dictionaryWord, index) => (
          <Box key={dictionaryWord.id}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={false}
                  onChange={() => handleWordToggle(dictionaryWord)}
                  disabled={isWordDisabled(dictionaryWord.word)}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', flexDirection: 'column', py: 1 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      fontSize: '1rem',
                      color: 'primary.main',
                      lineHeight: 1.2
                    }}
                  >
                    {dictionaryWord.word}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.9rem',
                      color: 'text.secondary',
                      fontStyle: 'italic',
                      mt: 0.5
                    }}
                  >
                    {dictionaryWord.translate}
                  </Typography>
                </Box>
              }
              sx={{
                margin: 0,
                width: '100%',
                py: 1,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            />
            {index < unselectedWords.length - 1 && (
              <Box
                sx={{
                  height: '1px',
                  backgroundColor: 'divider',
                  mx: 2,
                  opacity: 0.3
                }}
              />
            )}
          </Box>
        ))}
      </Box>

      {/* NOTE: Show message when no words found */}
      {displayWords.length === 0 && isInitialized && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {words.length === 0 ? 'Словарь пуст' : 'Слова не найдены'}
        </Typography>
      )}

      {/* NOTE: Custom topic and sentence count section */}
      <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Дополнительные настройки
        </Typography>

        <TextField
          fullWidth
          size="small"
          label="Тема (необязательно)"
          placeholder="Например: визит к доктору, поездка заграницу, в ресторане..."
          value={customTopic}
          onChange={e => onTopicChange?.(e.target.value)}
          multiline
          rows={2}
          sx={{ mb: 2 }}
          helperText="Опишите тему или ситуацию для генерации предложений"
        />

        <TextField
          fullWidth
          size="small"
          type="number"
          label="Количество предложений"
          value={sentenceCount ?? 5}
          onChange={e => {
            const value = parseInt(e.target.value, 10);
            if (!isNaN(value) && value >= 1 && value <= 20) {
              onSentenceCountChange?.(value);
            }
          }}
          inputProps={{ min: 1, max: 20 }}
          helperText="От 1 до 20 предложений"
        />
      </Box>
    </Paper>
  );
};

export default WordSelector;
