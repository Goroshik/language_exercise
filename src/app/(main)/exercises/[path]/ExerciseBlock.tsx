import React from 'react';
import {Box, Button, CircularProgress, Stack, Typography} from '@mui/material';

import TextWithInputs from 'src/components/TextWithInputs';

import LearnModeText from './LearnModeText';

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
    <Stack
      className="exercise-block-compact"
      sx={{
        marginBottom: 16,
        padding: 0,
        border: 'none',
        borderRadius: 0,
        backgroundColor: 'transparent',
        boxShadow: 'none'
      }}
    >
      <Typography variant="h6" sx={{mb: 2, color: '#1976d2'}}>
        Блок упражнений #{blockIndex + 1}
        <Typography variant="caption" sx={{ml: 1, color: 'text.secondary'}}>
          (создан {block.createdAt.toLocaleTimeString()})
        </Typography>
      </Typography>
      <Box sx={{
        padding: 1,
        backgroundColor: 'white',
        borderRadius: 8,
        border: '1px solid #e0e0e0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {block.exercises.map((exercise, exerciseIndex) => (
          <Box key={exerciseIndex} sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 2,
            mb: exerciseIndex < block.exercises.length - 1 ? 2 : 0
          }}>
            <Typography variant="body2" color="text.secondary" sx={{
              minWidth: 'auto',
              pt: 0.5
            }}>
              {exerciseIndex + 1}.
            </Typography>
            <Box sx={{flex: 1}}>
              {mode === 'learn' ? (
                <LearnModeText text={exercise.sentence}/>
              ) : (
                <TextWithInputs
                  text={exercise.sentence}
                  exerciseIndex={`${block.id}_${exerciseIndex}`}
                  validationResults={validationResults}
                />
              )}
            </Box>
          </Box>
        ))}
      </Box>

      {mode === 'train' && (
        <Box sx={{textAlign: 'center', mt: 2}}>
          <Button
            variant="contained"
            size="medium"
            onClick={handleCheckAnswers}
            disabled={block.isChecking}
            className="check-button"
          >
            {block.isChecking ? (
              <CircularProgress size={24}/>
            ) : (
              `Проверить блок #${blockIndex + 1}`
            )}
          </Button>
        </Box>
      )}
    </Stack>
  );
};

export default ExerciseBlock;
