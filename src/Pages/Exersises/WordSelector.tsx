import React, {useMemo, useState} from 'react';
import {Box, Checkbox, Paper, Stack, TextField, Typography} from '@mui/material';
import dictionaryData from '../../constants/dictionary_eng';

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

  // Parse dictionary entries to extract first English words/phrases
  const words = useMemo(() => {
    return dictionaryData.map(({word}) => word);
  }, []);

  // Filter words based on search text
  const filteredWords = useMemo(() => {
    if (!filterText) return words;
    return words.filter(word =>
      word.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [words, filterText]);

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

  return (
    <Paper
      sx={{
        p: 2,
        maxHeight: '400px',
        overflowY: 'auto',
        width: '300px'
      }}
    >
      <Typography variant="h6" sx={{mb: 2}}>
        Выберите слова ({selectedWords.length}/{maxWords})
      </Typography>

      <TextField
        fullWidth
        size="small"
        placeholder="Поиск слов..."
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        sx={{mb: 2}}
      />

      <Box>
        {filteredWords.map((word, index) => (
          <Stack key={word} direction="row" gap={0.5} alignItems="center">
            <Checkbox
              checked={selectedWords.includes(word)}
              onChange={() => handleWordToggle(word)}
              disabled={isWordDisabled(word)}
              size="small"
            />
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.85rem',
                color: isWordDisabled(word) ? 'text.disabled' : 'text.primary'
              }}
            >
              {word}
            </Typography>
          </Stack>
        ))}
      </Box>
    </Paper>
  );
};

export default WordSelector;
