'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import {
  Box,
  Button,
  ButtonGroup,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for button selections
  const [selectedMode, setSelectedMode] = useState<'student' | 'teacher'>('student');
  const [selectedLevel, setSelectedLevel] = useState<string>('A1');
  const [selectedWords, setSelectedWords] = useState<DictionaryWord[]>([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>('');
  const [historyAvailable, setHistoryAvailable] = useState<boolean>(false);
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [customTheme, setCustomTheme] = useState<string>('');
  const [sentenceCount, setSentenceCount] = useState<number | undefined>(undefined);

  // Get learning language from settings
  const { settings, loadSettings } = useSettingsStore();

  // Decode the topic name from URL - convert underscores to spaces and capitalize first letter of first word only
  const selectedTopic = path
    ? decodeURIComponent(path)
        .replace(/_/g, ' ')
        .replace(/^./, char => char.toUpperCase())
    : '';

  // Load settings on mount
  useEffect(() => {
    if (!settings) {
      loadSettings();
    }
  }, [settings, loadSettings]);

  // Reset sentence count to default when mode changes
  useEffect(() => {
    // Only reset if user hasn't manually set a custom count
    if (sentenceCount === undefined) {
      return; // Already using default, no need to update
    }
    // Reset to undefined to show the mode-appropriate default
    setSentenceCount(undefined);
  }, [selectedMode, sentenceCount]);

  // Load last selected level from settings for current language
  useEffect(() => {
    const loadLevelForLanguage = async () => {
      if (settings?.learningLanguage) {
        try {
          const response = await fetch(`/api/settings/level?language=${settings.learningLanguage}`);
          const data = await response.json();
          if (data.level) {
            setSelectedLevel(data.level);
          }
        } catch (error) {
          console.error('Failed to load level for language:', error);
        }
      }
    };
    
    loadLevelForLanguage();
  }, [settings?.learningLanguage]);

  // Fetch languages on mount and sync with user's learning language
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const res = await fetch('/api/languages');
        const data = await res.json();
        const langs = data.data || [];

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

  // Clear exercises when topic path changes
  useEffect(() => {
    // Clear exercises when changing to a different topic
    useAppStore.setState({ exerciseBlocks: [], validationResults: {}, savedAnswers: {} });
  }, [path]);

  // Check history availability when topic, level, language, or exerciseBlocks changes
  useEffect(() => {
    const checkHistory = async () => {
      if (!selectedLanguageId || !selectedTopic) {
        setHistoryAvailable(false);
        setHistoryCount(0);
        return;
      }

      try {
        const topicForApi = selectedTopic.toLowerCase();
        
        // Собираем ID предложений, которые уже отображаются на странице
        const currentSentenceIds = exerciseBlocks
          .flatMap(block => block.exercises)
          .map(ex => ex.sentenceId)
          .filter((id): id is string => id !== undefined);
        
        const result = await fetch('/api/ai/check-history-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: topicForApi,
            languageId: selectedLanguageId,
            level: selectedLevel,
            currentSentenceIds
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
  }, [selectedTopic, selectedLevel, selectedLanguageId, exerciseBlocks]);

  // Update the store's selectedTopic when the component mounts
  useEffect(() => {
    // Reset navigation state when this page loads
    setIsNavigating(false);

    const topicPath = path ? decodeURIComponent(path) : '';
    useAppStore.setState({ selectedTopic, lastSelectedTopicPath: topicPath });

    // Save to localStorage and database
    if (topicPath && typeof window !== 'undefined') {
      localStorage.setItem('lastSelectedTopicPath', topicPath);
      
      // Save topic for current learning language
      if (settings?.learningLanguage) {
        fetch('/api/settings/topic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            language: settings.learningLanguage, 
            topic: topicPath 
          })
        }).catch(error => {
          console.error('Failed to save topic for language:', error);
        });
      }
    }

    setState('topics-loaded');
  }, [selectedTopic, path, setIsNavigating, setState, settings]);

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
      mode: selectedMode,
      customTheme,
      sentenceCount
    });
  };

  const handleGenerateInitial = () => {
    handleTopicSelect({
      languageId: selectedLanguageId,
      level: selectedLevel,
      selectedWords,
      mode: selectedMode,
      customTheme,
      sentenceCount
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

  const handleLevelChange = async (level: string) => {
    setSelectedLevel(level);
    
    // Save level for current learning language
    if (settings?.learningLanguage) {
      try {
        await fetch('/api/settings/level', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            language: settings.learningLanguage, 
            level 
          })
        });
      } catch (error) {
        console.error('Failed to save level for language:', error);
      }
    }
  };

  return (
    <Box>
      <Stack
        direction={isMobile ? 'column' : 'row'}
        sx={{
          marginBottom: 2,
          alignItems: isMobile ? 'stretch' : 'center',
          gap: { xs: 1, sm: 1.5, md: 2 },
          padding: { xs: 1.5, sm: 2 },
          backgroundColor: '#f5f5f5',
          borderRadius: 2,
          flexWrap: 'wrap'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            width: isMobile ? '100%' : 'auto'
          }}
        >
          <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Тема:
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'normal',
              fontSize: { xs: '1rem', sm: '1.25rem' },
              flexGrow: isMobile ? 1 : 0
            }}
          >
            {selectedTopic}
          </Typography>
          <Button
            size="small"
            onClick={handleBackToTopics}
            variant="outlined"
            sx={{
              textTransform: 'none',
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              whiteSpace: 'nowrap'
            }}
          >
            Сменить тему
          </Button>
        </Box>

        {/* Generation Mode Selection */}
        <ButtonGroup variant="outlined" size="small" sx={{ width: isMobile ? '100%' : 'auto' }}>
          <Button
            variant={selectedMode === 'student' ? 'contained' : 'outlined'}
            onClick={() => setSelectedMode('student')}
            sx={{
              textTransform: 'none',
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              flex: isMobile ? 1 : 'initial'
            }}
          >
            Студент
          </Button>
          <Button
            variant={selectedMode === 'teacher' ? 'contained' : 'outlined'}
            onClick={() => setSelectedMode('teacher')}
            sx={{
              textTransform: 'none',
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              flex: isMobile ? 1 : 'initial'
            }}
          >
            Преподаватель
          </Button>
        </ButtonGroup>

        {/* Level Selection */}
        <ButtonGroup variant="outlined" size="small" sx={{ width: isMobile ? '100%' : 'auto' }}>
          {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(level => (
            <Button
              key={level}
              variant={selectedLevel === level ? 'contained' : 'outlined'}
              onClick={() => handleLevelChange(level)}
              sx={{
                textTransform: 'none',
                minWidth: { xs: 'auto', sm: '45px' },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                flex: isMobile ? 1 : 'initial',
                padding: { xs: '4px 8px', sm: '4px 11px' }
              }}
            >
              {level}
            </Button>
          ))}
        </ButtonGroup>
      </Stack>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, md: 3 }
        }}
      >
        {/* Main content - left side */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {exerciseBlocks.length === 0 ? (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography
                variant="body1"
                sx={{
                  mb: 2,
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Упражнения для темы &#34;{selectedTopic}&#34; будут загружены здесь.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                size={isMobile ? 'medium' : 'large'}
                onClick={handleGenerateInitial}
                disabled={isLoading}
                className="add-more-button"
                sx={{
                  fontSize: { xs: '0.95rem', sm: '1.1rem' },
                  padding: { xs: '10px 24px', sm: '12px 32px' }
                }}
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
                  size={isMobile ? 'medium' : 'large'}
                  onClick={handleGenerateMore}
                  disabled={isLoading}
                  className="add-more-button"
                  sx={{
                    fontSize: { xs: '0.95rem', sm: '1.1rem' },
                    padding: { xs: '10px 24px', sm: '12px 32px' }
                  }}
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

        {/* Word selector - right side / bottom on mobile */}
        {!isMobile && (
          <Box
            sx={{
              width: { md: '300px' },
              flexShrink: 0
            }}
          >
            <WordSelector 
              selectedWords={selectedWords} 
              onWordsChange={setSelectedWords}
              customTheme={customTheme}
              onThemeChange={setCustomTheme}
              sentenceCount={sentenceCount}
              onSentenceCountChange={setSentenceCount}
              mode={selectedMode}
            />
          </Box>
        )}

        {/* Word selector for mobile - collapsible or at bottom */}
        {isMobile && exerciseBlocks.length > 0 && (
          <Box sx={{ width: '100%', mt: 2 }}>
            <WordSelector 
              selectedWords={selectedWords} 
              onWordsChange={setSelectedWords}
              customTheme={customTheme}
              onThemeChange={setCustomTheme}
              sentenceCount={sentenceCount}
              onSentenceCountChange={setSentenceCount}
              mode={selectedMode}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Page;
