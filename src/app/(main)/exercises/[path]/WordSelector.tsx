import {
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useDebounce } from 'src/hooks/useDebounce';
import { DictionaryWord } from 'src/types';
import { showAlert } from 'src/utils/alert';

interface DictionaryWordWithUsage extends DictionaryWord {
  usageStats?: Array<{
    count: number;
    lastUsedAt: string;
  }>;
}

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
  const [words, setWords] = useState<DictionaryWordWithUsage[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Debounce search query for server requests
  const debouncedSearchQuery = useDebounce(filterText, 500);

  // Load initial words on mount (limited to 20)
  useEffect(() => {
    loadWords('', 20);
  }, []);

  // Load words when debounced search query changes
  useEffect(() => {
    if (isInitialized) {
      // When searching, don't limit results
      loadWords(debouncedSearchQuery, debouncedSearchQuery.trim() ? undefined : 20);
    }
  }, [debouncedSearchQuery]);

  const loadWords = async (query: string, limit?: number) => {
    try {
      setIsSearching(true);
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (limit) params.append('limit', limit.toString());
      // Всегда сортируем по использованию в WordSelector
      params.append('sortByUsage', 'true');
      
      const url = `/api/dictionary/words?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        const loadedWords: DictionaryWordWithUsage[] = data.words;
        setWords(loadedWords);
        // Собираем уникальные теги из слов
        const tagSet = new Set<string>();

        setAllTags(Array.from(tagSet).sort());
        setIsInitialized(true);
      }
    } catch (_error) {
      showAlert.error('Failed to load words');
      setIsInitialized(true);
    } finally {
      setIsSearching(false);
    }
  };

  // Теги вычисляются из загруженных слов, отдельный запрос не нужен

  const handleWordToggle = useCallback((word: DictionaryWord) => {
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
  }, [selectedWords, maxWords, onWordsChange]);

  const isWordDisabled = useCallback((wordText: string) => {
    return selectedWords.length >= maxWords && !selectedWords.some(w => w.word === wordText);
  }, [selectedWords, maxWords]);

  // NOTE: Handle tag selection for filtering
  const handleTagToggle = useCallback((tag: string) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newSelectedTags);
  }, [selectedTags]);

  // NOTE: Clear all tag filters
  const handleClearFilters = useCallback(() => {
    setSelectedTags([]);
  }, []);

  // NOTE: Words from server are already filtered by search query
  // Split into selected and unselected groups
  // Selected words always appear at the top, regardless of search
  const selectedWordsList: DictionaryWordWithUsage[] = selectedWords
    .map(selectedWord => {
      // Найти соответствующее слово с статистикой использования
      const wordWithStats = words.find(w => w.id === selectedWord.id);
      return wordWithStats || { ...selectedWord, usageStats: [] };
    })
    .filter(word => words.some(w => w.id === word.id) || filterText.trim() === ''); // Keep selected words visible even if not in search results
  
  const unselectedWords = words.filter(word => !selectedWords.some(w => w.id === word.id));

  // Combine for display count check
  const displayWords = [...selectedWordsList, ...unselectedWords];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: { xs: 'auto', md: 'calc(100vh - 200px)' },
        width: '100%',
        gap: 2
      }}
    >
      {/* NOTE: Settings section - fixed height, no scroll */}
      <Paper
        sx={{
          p: 3,
          backgroundColor: '#fafafa',
          flexShrink: 0
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Настройки генерации
        </Typography>

        <TextField
          fullWidth
          size="small"
          label="Препромпт (необязательно)"
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
      </Paper>

      {/* NOTE: Word selection section - scrollable */}
      <Paper
        sx={{
          p: 3,
          backgroundColor: '#fafafa',
          flex: 1,
          overflowY: 'auto',
          minHeight: 0
        }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          Выберите слова ({selectedWords.length}/{maxWords})
        </Typography>
        <Typography variant="caption" sx={{ mb: 2, color: 'text.secondary', display: 'block' }}>
          Слова сортируются по частоте использования (менее используемые показаны первыми)
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
          InputProps={{
            endAdornment: isSearching ? (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            ) : null
          }}
        />

        {/* NOTE: Display filtered dictionary words - limited to 20 visible without search */}
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                          {dictionaryWord.usageStats && dictionaryWord.usageStats[0] && (
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.75rem',
                                color: 'text.secondary',
                                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                px: 1,
                                py: 0.25,
                                borderRadius: 1,
                                fontWeight: 500
                              }}
                            >
                              {dictionaryWord.usageStats[0].count}x
                            </Typography>
                          )}
                        </Box>
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
                    {filterText.trim() 
                      ? 'Результаты поиска'
                      : 'Доступные слова (показано до 20, используйте поиск для остальных)'
                    }
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

          {/* Unselected words section - server already handles limiting */}
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                      {dictionaryWord.usageStats && dictionaryWord.usageStats[0] ? (
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.75rem',
                            color: 'text.secondary',
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            fontWeight: 500
                          }}
                        >
                          {dictionaryWord.usageStats[0].count}x
                        </Typography>
                      ) : (
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.75rem',
                            color: 'warning.main',
                            backgroundColor: 'rgba(255, 152, 0, 0.1)',
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            fontWeight: 500
                          }}
                        >
                          новое
                        </Typography>
                      )}
                    </Box>
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
      </Paper>
    </Box>
  );
};

export default WordSelector;
