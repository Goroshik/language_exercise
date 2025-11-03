'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { Box, Button, ButtonGroup, Stack, Typography } from '@mui/material';

import { useAppStore } from 'src/store/appStore';
import { useSettingsStore } from 'src/store/settingsStore';
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
  const { path } = useParams<{ path: string }>();
  const navigate = useRouter();

  // State for button selections
  const [selectedMode, setSelectedMode] = useState<'student' | 'teacher'>('student');
  const [selectedLevel, setSelectedLevel] = useState<string>('A1');
  const [selectedWords, setSelectedWords] = useState<DictionaryWord[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>('');
  const [historyAvailable, setHistoryAvailable] = useState<boolean>(false);
  const [historyCount, setHistoryCount] = useState<number>(0);

  // Get learning language from settings
  const { settings, loadSettings } = useSettingsStore();

  // Decode the topic name from URL - convert underscores to spaces and capitalize first letter
  const selectedTopic = path
    ? decodeURIComponent(path)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase())
    : '';

  // Load settings on mount
  useEffect(() => {
    if (!settings) {
      loadSettings();
    }
  }, [settings, loadSettings]);

  // Fetch languages on mount and sync with user's learning language
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const res = await fetch('/api/languages');
        const data = await res.json();
        const langs = data.data || [];
        setLanguages(langs);

        // Use learning language from settings
        if (settings?.learningLanguage) {
          const userLang = langs.find((l: Language) => l.code === settings.learningLanguage);
          if (userLang) {
            setSelectedLanguageId(userLang.id);
          }
        } else {
          // Fallback to English if no settings
          const englishLang = langs.find((l: Language) => l.code === 'en');
          if (englishLang) {
            setSelectedLanguageId(englishLang.id);
          } else if (langs.length > 0) {
            setSelectedLanguageId(langs[0].id);
          }
        }
      } catch {
        showAlert.error('Failed to fetch languages');
      }
    };
    fetchLanguages();
  }, [settings?.learningLanguage]);

  // Check history availability when topic, level, or language changes
  useEffect(() => {
    const checkHistory = async () => {
      if (!selectedLanguageId || !selectedTopic) {
        setHistoryAvailable(false);
        setHistoryCount(0);
        return;
      }

      try {
        const topicForApi = selectedTopic.toLowerCase();
        const result = await fetch('/api/ai/check-history-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: topicForApi,
            languageId: selectedLanguageId,
            level: selectedLevel
          })
        });
        const json = await result.json();
        setHistoryAvailable(json.available || false);
        setHistoryCount(json.count || 0);
      } catch (err) {
        console.error('Failed to check history availability:', err);
        setHistoryAvailable(false);
        setHistoryCount(0);
      }
    };

    checkHistory();
  }, [selectedTopic, selectedLevel, selectedLanguageId]);

  // Use app state store
  const {
    state,
    setState,
    exerciseBlocks,
    validationResults,
    handleTopicSelect,
    generateMoreExercises,
    loadTrainingExercises,
    handleCheckAnswers,
    setIsNavigating
  } = useAppStore();

  // Update the store's selectedTopic when the component mounts
  useEffect(() => {
    // Reset navigation state when this page loads
    setIsNavigating(false);

    const topicPath = path ? decodeURIComponent(path) : '';
    useAppStore.setState({ selectedTopic, lastSelectedTopicPath: topicPath });

    // Save to localStorage (client-side only)
    if (topicPath && typeof window !== 'undefined') {
      localStorage.setItem('lastSelectedTopicPath', topicPath);
    }

    setState('topics-loaded');
  }, [selectedTopic, path, setIsNavigating, setState]);

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

  const handleTrainFromHistory = () => {
    loadTrainingExercises({
      languageId: selectedLanguageId,
      level: selectedLevel,
      mode: selectedMode,
      limit: 5
    });
  };

  return (
    <Box>
      <Stack
        direction="row"
        sx={{
          marginBottom: 2,
          alignItems: 'center',
          gap: 2,
          padding: 2,
          backgroundColor: '#f5f5f5',
          borderRadius: 2,
          flexWrap: 'wrap'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">Тема:</Typography>
          <Typography variant="h6" sx={{ fontWeight: 'normal' }}>
            {selectedTopic}
          </Typography>
          <Button
            size="small"
            onClick={handleBackToTopics}
            variant="outlined"
            sx={{ textTransform: 'none' }}
          >
            Сменить тему
          </Button>
        </Box>

        {/* Generation Mode Selection */}
        <ButtonGroup variant="outlined" size="small">
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
        <ButtonGroup variant="outlined" size="small">
          {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(level => (
            <Button
              key={level}
              variant={selectedLevel === level ? 'contained' : 'outlined'}
              onClick={() => setSelectedLevel(level)}
              sx={{ textTransform: 'none', minWidth: '45px' }}
            >
              {level}
            </Button>
          ))}
        </ButtonGroup>
      </Stack>

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Main content - left side */}
        <Box sx={{ flex: 1 }}>
          {exerciseBlocks.length === 0 ? (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Упражнения для темы &#34;{selectedTopic}&#34; будут загружены здесь.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGenerateInitial}
                  disabled={isLoading}
                  className="add-more-button"
                >
                  {isLoading ? 'Генерируем...' : 'Создать упражнения'}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleTrainFromHistory}
                  disabled={!historyAvailable || isLoading}
                  className="train-from-history-button"
                  title={
                    historyAvailable
                      ? `Доступно ${historyCount} упражнений из истории`
                      : 'Нет сохранённых упражнений для этой темы и уровня'
                  }
                >
                  {isLoading
                    ? 'Загружаем...'
                    : `Тренировка из истории${historyAvailable ? ` (${historyCount})` : ''}`}
                </Button>
              </Box>
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

              <Box
                sx={{
                  textAlign: 'center',
                  mt: 4,
                  display: 'flex',
                  gap: 2,
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}
              >
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleGenerateMore}
                  disabled={isLoading}
                  className="add-more-button"
                >
                  {isLoading ? 'Генерируем...' : 'Добавить ещё упражнения'}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleTrainFromHistory}
                  disabled={!historyAvailable || isLoading}
                  className="train-from-history-button"
                  title={
                    historyAvailable
                      ? `Доступно ${historyCount} упражнений из истории`
                      : 'Нет сохранённых упражнений для этой темы и уровня'
                  }
                >
                  {isLoading
                    ? 'Загружаем...'
                    : `Тренировка из истории${historyAvailable ? ` (${historyCount})` : ''}`}
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
