'use client';

import React, {useState} from 'react';
import {useRouter, useParams} from "next/navigation";

import {Box, Button, ButtonGroup, Stack, Typography} from '@mui/material';

import {useAppStore} from 'src/store/appStore';

import ExerciseBlock from './ExerciseBlock';
import WordSelector from './WordSelector';
import {DictionaryWord} from "src/types";

const Page: React.FC = () => {
  const {topicName} = useParams<{ topicName: string }>();
  const navigate = useRouter();
  const selectedLanguage: string = 'English';

  // State for button selections
  const [selectedMode, setSelectedMode] = useState<'learn' | 'train'>('learn');
  const [selectedLevel, setSelectedLevel] = useState<string>('A1');
  const [selectedWords, setSelectedWords] = useState<DictionaryWord[]>([]);

  // Decode the topic name from URL
  const selectedTopic = topicName ? decodeURIComponent(topicName) : '';

  // Use app state store
  const {
    state,
    exerciseBlocks,
    validationResults,
    handleTopicSelect,
    generateMoreExercises,
    handleCheckAnswers
  } = useAppStore();

  // Check if AI request is in progress
  const isLoading = state === 'loading-exercises';

  const handleBackToTopics = () => {
    navigate.push('/');
  };

  const handleGenerateMore = () => {
    generateMoreExercises({
      language: selectedLanguage,
      level: selectedLevel,
      selectedWords,
      mode: selectedMode
    });
  };

  const handleGenerateInitial = () => {
    handleTopicSelect({
      language: selectedLanguage,
      level: selectedLevel,
      selectedWords,
      mode: selectedMode
    });
  };

  console.log('ExerciseBlocks:', exerciseBlocks);

  return (
    <Box>
      <Stack direction="row" sx={{
        marginBottom: 2,
        alignItems: 'center',
        gap: 1,
        padding: 2,
        backgroundColor: '#f5f5f5',
        borderRadius: 16
      }}>
        <Typography variant="h6">
          Тема: {selectedTopic}
        </Typography>
        <Button
          size="small"
          onClick={handleBackToTopics}
          variant="outlined"
          sx={{textTransform: 'none'}}
        >
          Выбрать другую тему
        </Button>
      </Stack>

      <Box sx={{display: 'flex', gap: 3}}>
        {/* Main content - left side */}
        <Box sx={{flex: 1}}>
          {/* Generation Mode Selection */}
          <Box sx={{display: 'flex', justifyContent: 'center', gap: 2, mb: 3}}>
            <ButtonGroup variant="outlined" size="medium">
              <Button
                variant={selectedMode === 'learn' ? 'contained' : 'outlined'}
                onClick={() => setSelectedMode('learn')}
                sx={{textTransform: 'none'}}
              >
                Учить
              </Button>
              <Button
                variant={selectedMode === 'train' ? 'contained' : 'outlined'}
                onClick={() => setSelectedMode('train')}
                sx={{textTransform: 'none'}}
              >
                Тренирова
              </Button>
            </ButtonGroup>

            {/* Level Selection */}
            <ButtonGroup variant="outlined" size="medium">
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => (
                <Button
                  key={level}
                  variant={selectedLevel === level ? 'contained' : 'outlined'}
                  onClick={() => setSelectedLevel(level)}
                  sx={{textTransform: 'none', minWidth: '50px'}}
                >
                  {level}
                </Button>
              ))}
            </ButtonGroup>
          </Box>

          {exerciseBlocks.length === 0 ? (
            <Box sx={{textAlign: 'center', mt: 4}}>
              <Typography variant="body1" sx={{mb: 2}}>
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

              <Box sx={{textAlign: 'center', mt: 4}}>
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
        <Box sx={{width: '300px', flexShrink: 0}}>
          <WordSelector
            selectedWords={selectedWords}
            onWordsChange={setSelectedWords}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Page;
