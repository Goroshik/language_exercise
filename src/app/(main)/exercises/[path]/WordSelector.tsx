import React, { useState, useEffect} from 'react';
import {Box, Checkbox, Chip, FormControlLabel, Paper, Stack, TextField, Typography} from '@mui/material';
import {DictionaryWord} from 'src/types';

interface WordSelectorProps {
  selectedWords: string[];
  onWordsChange: (words: string[]) => void;
  maxWords?: number;
}

const WordSelector: React.FC<WordSelectorProps> = ({
                                                     selectedWords,
                                                     onWordsChange,
                                                     maxWords = 5
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
        loadedWords.forEach(w => {
          if (Array.isArray(w.tags)) {
            w.tags.forEach(t => tagSet.add(t));
          }
        });
        setAllTags(Array.from(tagSet).sort());
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('Failed to load words:', error);
      setIsInitialized(true);
    }
  };

  // Теги вычисляются из загруженных слов, отдельный запрос не нужен

  const getFilteredWords = (searchQuery: string = '') => {
    return words.filter(word => {
      // Filter by tags
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.some(tag => word.tags.includes(tag));

      // Filter by search query
      const matchesSearch = searchQuery === '' ||
        word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        word.translate.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTags && matchesSearch;
    });
  };



  const handleWordToggle = (word: string) => {
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

  const isWordDisabled = (word: string) => {
    return selectedWords.length >= maxWords && !selectedWords.includes(word);
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

  return (
    <Paper
      sx={{
        p: 3,
        maxHeight: '400px',
        overflowY: 'auto',
        width: '450px',
        backgroundColor: '#fafafa'
      }}
    >
      <Typography variant="h6" sx={{mb: 2}}>
        Выберите слова ({selectedWords.length}/{maxWords})
      </Typography>

      {/* NOTE: Tag filtering section */}
      {allTags.length > 0 && (
        <Box sx={{mb: 2}}>
          <Typography variant="subtitle2" sx={{mb: 1, color: 'text.secondary'}}>
            Фильтр по тегам:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {allTags.map(tag => (
              <Chip
                key={tag}
                label={tag}
                onClick={() => handleTagToggle(tag)}
                color={selectedTags.includes(tag) ? "primary" : "default"}
                variant={selectedTags.includes(tag) ? "filled" : "outlined"}
                size="small"
                sx={{
                  '&:hover': {
                    backgroundColor: selectedTags.includes(tag)
                      ? 'primary.dark'
                      : 'action.hover'
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
                sx={{ml: 1}}
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
        onChange={(e) => setFilterText(e.target.value)}
        sx={{mb: 2}}
      />

      {/* NOTE: Display filtered dictionary words */}
      <Box sx={{display: 'flex', flexDirection: 'column', gap: 0}}>
        {filteredWords.map((dictionaryWord, index) => (
          <Box key={dictionaryWord.id}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedWords.includes(dictionaryWord.word)}
                  onChange={() => handleWordToggle(dictionaryWord.word)}
                  disabled={isWordDisabled(dictionaryWord.word)}
                  color="primary"
                />
              }
              label={
                <Box sx={{display: 'flex', flexDirection: 'column', py: 1}}>
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
            {/* NOTE: Add separator between words except for the last one */}
            {index < filteredWords.length - 1 && (
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
      {filteredWords.length === 0 && isInitialized && (
        <Typography variant="body2" color="text.secondary" sx={{mt: 2}}>
          {words.length === 0 ? 'Словарь пуст' : 'Слова не найдены'}
        </Typography>
      )}
    </Paper>
  );
};

export default WordSelector;
