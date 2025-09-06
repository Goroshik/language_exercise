import React, {useState, useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom';

import {Box, Button, Typography, ButtonGroup} from '@mui/material';

import {StyledTopicHeader} from '../../constants/styles';
import ExerciseBlock from '../../components/ExerciseBlock';
import {useAppState} from '../../hooks/useAppState';


interface Exercise {
  sentence: string;
  correctAnswers: string[];
}

interface ExerciseBlock {
  id: string;
  exercises: Exercise[];
  createdAt: Date;
  isChecking: boolean;
}

interface ExercisesViewProps {
  // Props are now optional since we get data from URL and will implement exercise generation later
}

const Index: React.FC<ExercisesViewProps> = () => {
  const {topicName} = useParams<{ topicName: string }>();
  const navigate = useNavigate();

  // State for button selections
  const [selectedMode, setSelectedMode] = useState<'learn' | 'train'>('learn');
  const [selectedLevel, setSelectedLevel] = useState<string>('A1');

  // Decode the topic name from URL
  const selectedTopic = topicName ? decodeURIComponent(topicName) : '';

  // Use app state hook
  const {
    exerciseBlocks,
    validationResults,
    handleTopicSelect,
    generateMoreExercises,
    handleCheckAnswers
  } = useAppState();

  // Initialize exercises when component mounts
  useEffect(() => {
    if (selectedTopic && exerciseBlocks.length === 0) {
      handleTopicSelect(selectedTopic, selectedMode, selectedLevel);
    }
  }, [selectedTopic, selectedMode, selectedLevel, handleTopicSelect, exerciseBlocks.length]);

  const handleBackToTopics = () => {
    navigate('/');
  };

  const handleGenerateMore = () => {
    generateMoreExercises(selectedMode, selectedLevel);
  };

  return (
    <Box>
      <StyledTopicHeader>
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
      </StyledTopicHeader>

      {/* Generation Mode Selection */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
        <ButtonGroup variant="outlined" size="medium">
          <Button
            variant={selectedMode === 'learn' ? 'contained' : 'outlined'}
            onClick={() => setSelectedMode('learn')}
            sx={{ textTransform: 'none' }}
          >
            Учить
          </Button>
          <Button
            variant={selectedMode === 'train' ? 'contained' : 'outlined'}
            onClick={() => setSelectedMode('train')}
            sx={{ textTransform: 'none' }}
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
              sx={{ textTransform: 'none', minWidth: '50px' }}
            >
              {level}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {exerciseBlocks.length === 0 ? (
        <Box sx={{textAlign: 'center', mt: 4}}>
          <Typography variant="body1" sx={{mb: 2}}>
            Упражнения для темы "{selectedTopic}" будут загружены здесь.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleGenerateMore}
            className="add-more-button"
          >
            Создать упражнения
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
              className="add-more-button"
            >
              Добавить ещё упражнения
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default Index;
