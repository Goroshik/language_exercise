"use client"

import React, {useEffect, useState} from 'react';
import {Add as AddIcon, FileUpload as ImportIcon} from '@mui/icons-material';
import {Box, Button, Container, Paper, Stack, Typography} from '@mui/material';

import {DictionaryWord} from 'src/types';
import ImportWordsModal from "src/components/ImportWordsModal";

import WordCard from './WordCard';
import AddWordModal from './AddWordModal';
import TagFilter from './TagFilter';

const DictionaryPage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [words, setWords] = useState<DictionaryWord[]>([]);
  const [filteredWords, setFilteredWords] = useState<DictionaryWord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeDB = async () => {
    try {
      const response = await fetch('/api/dictionary/init', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        setWords(data.words);
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
      setIsInitialized(true);
    }
  };

  const loadWords = async () => {
    try {
      const response = await fetch('/api/dictionary/words');
      const data = await response.json();

      if (data.success) {
        setWords(data.words);
      }
    } catch (error) {
      console.error('Failed to load words:', error);
    }
  };

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

  useEffect(() => {
    // Initialize database when component mounts
    if (!isInitialized) {
      initializeDB();
    }
  }, []);

  useEffect(() => {
    if (isInitialized) {
      setFilteredWords(getFilteredWords(searchQuery));
    }
  }, [words, isInitialized, searchQuery, selectedTags]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };


  return (
    <Container maxWidth="lg" sx={{mt: 4, mb: 4}}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Словарь
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<ImportIcon/>}
            onClick={() => setIsImportModalOpen(true)}
            size="large"
          >
            Импорт слов
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon/>}
            onClick={() => setIsAddModalOpen(true)}
            size="large"
          >
            Добавить слово
          </Button>
        </Box>
      </Box>

      <Box display="flex" gap={3}>
        <Box flex="0 0 250px">
          <TagFilter
            onSearchChange={handleSearchChange}
            selectedTags={selectedTags}
            onSelectedTagsChange={setSelectedTags}
          />
        </Box>

        <Box flex="1">
          {filteredWords.length === 0 ? (
            <Paper sx={{p: 4, textAlign: 'center'}}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Слова не найдены
              </Typography>
            </Paper>
          ) : (
            <Stack
              direction="row"
              flexWrap="wrap"
              gap={2}
              sx={{
                '& > *': {
                  minWidth: 250,
                  flex: '1 1 calc(33.333% - 16px)',
                  maxWidth: 'calc(33.333% - 16px)',
                },
              }}
            >
              {filteredWords.map((word) => (
                <WordCard
                  key={word.id}
                  word={word}
                  onWordUpdate={loadWords}
                  onWordDelete={loadWords}
                />
              ))}
            </Stack>
          )}
        </Box>
      </Box>

      <AddWordModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <ImportWordsModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </Container>
  );
};

export default DictionaryPage;
