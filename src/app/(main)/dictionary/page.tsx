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
  CircularProgress,
  Container,
  InputAdornment,
  Pagination,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

import ImportWordsModal from 'src/components/ImportWordsModal';
import { useDebounce } from 'src/hooks/useDebounce';
import { useSettingsStore } from 'src/store/settingsStore';
import { DictionaryWord } from 'src/types';
import { showAlert } from 'src/utils/alert';

import AddWordModal from './AddWordModal';
import WordCard from './WordCard';

const WORDS_PER_PAGE = 12;

const DictionaryPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [words, setWords] = useState<DictionaryWord[]>([]);
  const [totalWords, setTotalWords] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { settings, loadSettings } = useSettingsStore();

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

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
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    void loadWords();
  }, [debouncedSearchQuery, currentPage, settings?.learningLanguage]); // Reload when search, page, or language changes

  // Listen for language changes from header
  useEffect(() => {
    const handleLanguageChange = () => {
      setCurrentPage(1); // Reset to first page
      void loadWords();
    };

    window.addEventListener('learningLanguageChanged', handleLanguageChange);
    return () => {
      window.removeEventListener('learningLanguageChanged', handleLanguageChange);
    };
  }, []);

  const loadWords = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append('query', debouncedSearchQuery);
      params.append('page', currentPage.toString());
      params.append('limit', WORDS_PER_PAGE.toString());

      const url = `/api/dictionary/words?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setWords(data.words);
        setTotalWords(data.total);
      }
    } catch (_error) {
      showAlert.error('Failed to load words');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handlePageChange = useCallback((_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  }, []);

  // Calculate total pages from server data
  const totalPages = Math.ceil(totalWords / WORDS_PER_PAGE);

  return (
    <Container
      maxWidth="lg"
      sx={{
        mt: { xs: 2, sm: 4 },
        mb: { xs: 2, sm: 4 },
        px: { xs: 1, sm: 2 }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          mb: 3,
          gap: { xs: 2, sm: 0 }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, sm: 2 },
            flexWrap: 'wrap'
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontSize: { xs: '1.5rem', sm: '2.125rem' }
            }}
          >
            Словарь
          </Typography>
          <Chip
            icon={<LanguageIcon />}
            label={getLanguageDisplayName()}
            color="primary"
            variant="outlined"
            size={isMobile ? 'small' : 'medium'}
          />
          <Chip
            label={`${totalWords} ${totalWords === 1 ? 'слово' : totalWords < 5 ? 'слова' : 'слов'}`}
            size={isMobile ? 'small' : 'medium'}
            sx={{ fontWeight: 500 }}
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            gap: { xs: 1, sm: 2 },
            flexDirection: { xs: 'column', sm: 'row' },
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          <Button
            variant="outlined"
            startIcon={!isMobile && <ImportIcon />}
            onClick={() => setIsImportModalOpen(true)}
            size={isMobile ? 'medium' : 'large'}
            fullWidth={isMobile}
            sx={{
              fontSize: { xs: '0.875rem', sm: '0.9375rem' }
            }}
          >
            Импорт слов
          </Button>
          <Button
            variant="contained"
            startIcon={!isMobile && <AddIcon />}
            onClick={() => setIsAddModalOpen(true)}
            size={isMobile ? 'medium' : 'large'}
            fullWidth={isMobile}
            sx={{
              fontSize: { xs: '0.875rem', sm: '0.9375rem' }
            }}
          >
            Добавить слово
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          mb: 3
        }}
      >
        <TextField
          fullWidth
          placeholder="Поиск по слову или переводу..."
          value={searchQuery}
          onChange={e => handleSearchChange(e.target.value)}
          size={isMobile ? 'small' : 'medium'}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: isLoading ? (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ) : null
            }
          }}
        />
      </Box>

      {isLoading && words.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : words.length === 0 ? (
        <Paper sx={{ p: { xs: 2, sm: 4 }, textAlign: 'center' }}>
          <LanguageIcon sx={{ fontSize: { xs: 36, sm: 48 }, color: 'text.secondary', mb: 2 }} />
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              color: 'text.secondary',
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            {searchQuery
              ? 'Слова не найдены'
              : `Словарь для ${getLanguageDisplayName().toLowerCase()} языка пуст`}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            }}
          >
            {searchQuery
              ? 'Попробуйте изменить поисковый запрос'
              : 'Добавьте слова через кнопку "Добавить слово" или "Импорт слов"'}
          </Typography>
        </Paper>
      ) : (
        <>
          <Stack
            direction="row"
            sx={{
              flexWrap: 'wrap',
              gap: { xs: 1, sm: 2 },

              '& > *': {
                minWidth: { xs: '100%', sm: 250 },
                flex: {
                  xs: '1 1 100%',
                  sm: '1 1 calc(50% - 8px)',
                  md: '1 1 calc(33.333% - 16px)'
                },
                maxWidth: {
                  xs: '100%',
                  sm: 'calc(50% - 8px)',
                  md: 'calc(33.333% - 16px)'
                }
              }
            }}
          >
            {words.map(word => (
              <WordCard
                key={word.id}
                word={word}
                onWordUpdate={loadWords}
                onWordDelete={loadWords}
              />
            ))}
          </Stack>

          {totalPages > 1 && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mt: 4
              }}
            >
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
