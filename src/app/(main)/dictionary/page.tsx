'use client';

import React, { useEffect, useState } from 'react';
import {
  Add as AddIcon,
  FileUpload as ImportIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
  Pagination,
  TextField,
  InputAdornment
} from '@mui/material';

import { DictionaryWord } from 'src/types';
import ImportWordsModal from 'src/components/ImportWordsModal';

import WordCard from './WordCard';
import AddWordModal from './AddWordModal';

const WORDS_PER_PAGE = 12;

const DictionaryPage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [words, setWords] = useState<DictionaryWord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadWords();
  }, [searchQuery]);

  const loadWords = async () => {
    try {
      const url = `/api/dictionary/words${searchQuery ? `?query=${encodeURIComponent(searchQuery)}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setWords(data.words);
        setCurrentPage(1); // Reset to first page when data changes
      }
    } catch (error) {
      console.error('Failed to load words:', error);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  // Pagination logic
  const totalPages = Math.ceil(words.length / WORDS_PER_PAGE);
  const startIndex = (currentPage - 1) * WORDS_PER_PAGE;
  const endIndex = startIndex + WORDS_PER_PAGE;
  const paginatedWords = words.slice(startIndex, endIndex);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Словарь
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<ImportIcon />}
            onClick={() => setIsImportModalOpen(true)}
            size="large"
          >
            Импорт слов
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsAddModalOpen(true)}
            size="large"
          >
            Добавить слово
          </Button>
        </Box>
      </Box>

      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Поиск по слову или переводу..."
          value={searchQuery}
          onChange={e => handleSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </Box>

      {words.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Слова не найдены
          </Typography>
        </Paper>
      ) : (
        <>
          <Stack
            direction="row"
            flexWrap="wrap"
            gap={2}
            sx={{
              '& > *': {
                minWidth: 250,
                flex: '1 1 calc(33.333% - 16px)',
                maxWidth: 'calc(33.333% - 16px)'
              }
            }}
          >
            {paginatedWords.map(word => (
              <WordCard
                key={word.id}
                word={word}
                onWordUpdate={loadWords}
                onWordDelete={loadWords}
              />
            ))}
          </Stack>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}

      <AddWordModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onWordAdded={loadWords}
      />

      <ImportWordsModal open={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
    </Container>
  );
};

export default DictionaryPage;
