'use client';

import {
  Add as AddIcon,
  FileUpload as ImportIcon,
  Language as LanguageIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Container,
  InputAdornment,
  Pagination,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';

import ImportWordsModal from 'src/components/ImportWordsModal';
import { useSettingsStore } from 'src/store/settingsStore';
import { DictionaryWord } from 'src/types';
import { showAlert } from 'src/utils/alert';

import AddWordModal from './AddWordModal';
import WordCard from './WordCard';

const WORDS_PER_PAGE = 12;

const DictionaryPage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [words, setWords] = useState<DictionaryWord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { settings, loadSettings } = useSettingsStore();

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

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    loadWords();
  }, [searchQuery, settings?.learningLanguage]); // Reload when language changes

  // Listen for language changes from header
  useEffect(() => {
    const handleLanguageChange = () => {
      loadWords();
    };

    window.addEventListener('learningLanguageChanged', handleLanguageChange);
    return () => {
      window.removeEventListener('learningLanguageChanged', handleLanguageChange);
    };
  }, []);

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
      showAlert.error('Failed to load words');
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
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h4" component="h1">
            Словарь
          </Typography>
          <Chip
            icon={<LanguageIcon />}
            label={getLanguageDisplayName()}
            color="primary"
            variant="outlined"
            size="medium"
          />
          <Chip
            label={`${words.length} ${words.length === 1 ? 'слово' : words.length < 5 ? 'слова' : 'слов'}`}
            size="medium"
            sx={{ fontWeight: 500 }}
          />
        </Box>
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
          <LanguageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchQuery
              ? 'Слова не найдены'
              : `Словарь для ${getLanguageDisplayName().toLowerCase()} языка пуст`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery
              ? 'Попробуйте изменить поисковый запрос'
              : 'Добавьте слова через кнопку "Добавить слово" или "Импорт слов"'}
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
