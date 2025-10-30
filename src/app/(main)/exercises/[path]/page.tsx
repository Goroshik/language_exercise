'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { Box, Button, ButtonGroup, MenuItem, Stack, TextField, Typography } from '@mui/material';

import { useAppStore } from 'src/store/appStore';
import { showAlert } from 'src/utils/alert';

import { DictionaryWord } from 'src/types';
import ExerciseBlock from './ExerciseBlock';
import WordSelector from './WordSelector';

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
}

const Page: React.FC = () => {
  const { topicName } = useParams<{ topicName: string }>();
  const navigate = useRouter();

  // State for button selections
  const [selectedMode, setSelectedMode] = useState<'student' | 'teacher'>('student');
  const [selectedLevel, setSelectedLevel] = useState<string>('A1');
  const [selectedWords, setSelectedWords] = useState<DictionaryWord[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>('');

  // Decode the topic name from URL
  const selectedTopic = topicName ? decodeURIComponent(topicName) : '';

  // Fetch languages on mount
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const res = await fetch('/api/languages');
        const data = await res.json();
        const langs = data.data || [];
        setLanguages(langs);
        // Set default to English if available
        const englishLang = langs.find((l: Language) => l.code === 'en');
        if (englishLang) {
          setSelectedLanguageId(englishLang.id);
        } else if (langs.length > 0) {
          setSelectedLanguageId(langs[0].id);
        }
      } catch {
        showAlert.error('Failed to fetch languages');
      }
    };
    fetchLanguages();
  }, []);

  // Use app state store
  const {
    state,
    setState,
    exerciseBlocks,
    validationResults,
    handleTopicSelect,
    generateMoreExercises,
    handleCheckAnswers,
    setIsNavigating,
    savedAnswers,
    saveAnswer,
    loadSavedAnswers
  } = useAppStore();

  // Update the store's selectedTopic when the component mounts
  useEffect(() => {
    // Reset navigation state when this page loads
    setIsNavigating(false);

    const topicPath = topicName ? decodeURIComponent(topicName) : '';
    useAppStore.setState({ selectedTopic, lastSelectedTopicPath: topicPath });

    // Save to localStorage (client-side only)
    if (topicPath && typeof window !== 'undefined') {
      localStorage.setItem('lastSelectedTopicPath', topicPath);
    }

    setState('topics-loaded');
  }, [selectedTopic, topicName, setIsNavigating, setState]);

  // Check if AI request is in progress
  const isLoading = state === 'loading-exercises';

  const handleBackToTopics = () => {
    setIsNavigating(true);
    navigate.push('/');
  };

  const handleGenerateMore = () => {
    generateMoreExercises({
      languageId: selectedLanguageId,
      level: selectedLevel,
      selectedWords,
      mode: selectedMode
    });
  };

  const handleGenerateInitial = () => {
    handleTopicSelect({
      languageId: selectedLanguageId,
      level: selectedLevel,
      selectedWords,
      mode: selectedMode
    });
  };

  return (
    <Box>
      <Stack
        direction="row"
        sx={{
          marginBottom: 2,
          alignItems: 'center',
          gap: 1,
          padding: 2,
          backgroundColor: '#f5f5f5',
          borderRadius: 16
        }}
      >
        <Typography variant="h6">Тема: {selectedTopic}</Typography>
        <Button
          size="small"
          onClick={handleBackToTopics}
          variant="outlined"
          sx={{ textTransform: 'none' }}
        >
          Сменить тему
        </Button>
      </Stack>

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Main content - left side */}
        <Box sx={{ flex: 1 }}>
          {/* Generation Mode Selection */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <ButtonGroup variant="outlined" size="medium">
              <Button
                variant={selectedMode === 'student' ? 'contained' : 'outlined'}
                onClick={() => setSelectedMode('student')}
                sx={{ textTransform: 'none' }}
              >
                Студент
              </Button>
              <Button
                variant={selectedMode === 'teacher' ? 'contained' : 'outlined'}
                onClick={() => setSelectedMode('teacher')}
                sx={{ textTransform: 'none' }}
              >
                Преподаватель
              </Button>
            </ButtonGroup>

            {/* Level Selection */}
            <ButtonGroup variant="outlined" size="medium">
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(level => (
                <Button
                  key={level}
                  variant={selectedLevel === level ? 'contained' : 'outlined'}
                  onClick={() => setSelectedLevel(level)}
                  sx={{ textTransform: 'none', minWidth: '50px' }}
                >
                  {level}
                </Button>
              ))}
            </ButtonGroup>

            {/* Language Selection */}
            <TextField
              select
              label="Язык"
              value={selectedLanguageId}
              onChange={e => setSelectedLanguageId(e.target.value)}
              size="small"
              sx={{ minWidth: 150 }}
            >
              {languages.map(lang => (
                <MenuItem key={lang.id} value={lang.id}>
                  {lang.nativeName}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {exerciseBlocks.length === 0 ? (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Упражнения для темы &#34;{selectedTopic}&#34; будут загружены здесь.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleGenerateInitial}
                disabled={isLoading}
                className="add-more-button"
              >
                {isLoading ? 'Генерируем...' : 'Создать упражнения'}
              </Button>
            </Box>
          ) : (
            <>
              {exerciseBlocks.map((block, blockIndex) => (
                <ExerciseBlock
                  key={block.id}
                  block={block}
                  blockIndex={blockIndex}
                  validationResults={validationResults[block.id] || {}}
                  onCheckAnswers={handleCheckAnswers}
                  mode={selectedMode}
                />
              ))}

              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleGenerateMore}
                  disabled={isLoading}
                  className="add-more-button"
                >
                  {isLoading ? 'Генерируем...' : 'Добавить ещё упражнения'}
                </Button>
              </Box>
            </>
          )}
        </Box>

        {/* Word selector - right side */}
        <Box sx={{ width: '300px', flexShrink: 0 }}>
          <WordSelector selectedWords={selectedWords} onWordsChange={setSelectedWords} />
        </Box>
      </Box>
    </Box>
  );
};

export default Page;
