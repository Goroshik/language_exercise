import {Add as AddIcon, FileUpload as ImportIcon} from '@mui/icons-material';
import {Box, Button, Container, Paper, Stack, Typography} from '@mui/material';
import React, {useEffect, useState} from 'react';
import {useDictionaryStore} from '../../store/dictionaryStore';
import WordCard from "./WordCard";
import AddWordModal from "./AddWordModal";
import ImportWordsModal from "./ImportWordsModal";
import TagFilter from "./TagFilter";

const DictionaryPage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [filteredWords, setFilteredWords] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const {getFilteredWords, words, initializeDB, isInitialized, selectedTags} = useDictionaryStore();

  useEffect(() => {
    // Initialize IndexedDB when component mounts
    if (!isInitialized) {
      initializeDB();
    }
  }, [initializeDB, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setFilteredWords(getFilteredWords(searchQuery));
    }
  }, [words, getFilteredWords, isInitialized, searchQuery, selectedTags]);

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
          <TagFilter onSearchChange={handleSearchChange}/>
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
                <WordCard key={word.id} word={word}/>
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
