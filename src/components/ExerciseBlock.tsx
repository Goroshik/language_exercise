import React from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import TextWithInputs from '../TextWithInputs';
import LearnModeText from './LearnModeText';
import { StyledExerciseBlock, StyledExerciseItem } from '../constants/styles';

interface Exercise {
  sentence: string;
  correctAnswers: string[];
}

interface ExerciseBlockProps {
  block: {
    id: string;
    exercises: Exercise[];
    createdAt: Date;
    isChecking: boolean;
  };
  blockIndex: number;
  validationResults: { [key: string]: { isCorrect: boolean; error?: string } };
  onCheckAnswers: (blockId: string, userAnswers: { [key: string]: string }) => void;
  mode?: 'learn' | 'train';
}

const ExerciseBlock: React.FC<ExerciseBlockProps> = ({
  block,
  blockIndex,
  validationResults,
  onCheckAnswers,
  mode = 'train'
}) => {
  const handleCheckAnswers = () => {
    const inputs = document.querySelectorAll(`input[id^="input_${block.id}_"]`);
    const userAnswers: { [key: string]: string } = {};
    inputs.forEach(input => {
      userAnswers[input.id] = (input as HTMLInputElement).value;
    });
    onCheckAnswers(block.id, userAnswers);
  };

  return (
    <StyledExerciseBlock>
      <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>
        Блок упражнений #{blockIndex + 1}
        <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
          (создан {block.createdAt.toLocaleTimeString()})
        </Typography>
      </Typography>

      {block.exercises.map((exercise, exerciseIndex) => (
        <StyledExerciseItem key={exerciseIndex}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Предложение {exerciseIndex + 1}:
          </Typography>
          {mode === 'learn' ? (
            <LearnModeText text={exercise.sentence} />
          ) : (
            <TextWithInputs
              text={exercise.sentence}
              exerciseIndex={`${block.id}_${exerciseIndex}`}
              validationResults={validationResults}
            />
          )}
        </StyledExerciseItem>
      ))}

      {mode === 'train' && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button
            variant="contained"
            size="medium"
            onClick={handleCheckAnswers}
            disabled={block.isChecking}
            className="check-button"
          >
            {block.isChecking ? (
              <CircularProgress size={24} />
            ) : (
              `Проверить блок #${blockIndex + 1}`
            )}
          </Button>
        </Box>
      )}
    </StyledExerciseBlock>
  );
};

export default ExerciseBlock;
