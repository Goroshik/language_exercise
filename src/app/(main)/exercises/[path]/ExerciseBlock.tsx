import { Button, CircularProgress } from '@mui/material';
import React from 'react';
import {
  CheckButtonBox,
  ExerciseBlockCaption,
  ExerciseBlockContainer,
  ExerciseBlockInner,
  ExerciseBlockTitle,
  ExerciseContent,
  ExerciseIndex,
  ExerciseRow
} from './ExerciseBlock.styled';

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
  validationResults: { [key: string]: { isCorrect: boolean; error?: string; incorrectTranslations?: string[] } };
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
    // Collect textarea values instead of individual inputs
    const textareas = document.querySelectorAll(`textarea[id^="textarea_${block.id}_"]`);
    const userAnswers: { [key: string]: string } = {};
    textareas.forEach(textarea => {
      userAnswers[textarea.id] = (textarea as HTMLTextAreaElement).value;
    });
    onCheckAnswers(block.id, userAnswers);
  };

  console.log(block.exercises)

  return (
    <ExerciseBlockContainer className="exercise-block-compact">
      <ExerciseBlockTitle variant="h6">
        Блок упражнений #{blockIndex + 1}
        <ExerciseBlockCaption variant="caption">
          (создан {block.createdAt.toLocaleTimeString()})
        </ExerciseBlockCaption>
      </ExerciseBlockTitle>
      <ExerciseBlockInner>
        {block.exercises.map((exercise, exerciseIndex) => (
          <ExerciseRow key={exerciseIndex} sx={{ mb: exerciseIndex < block.exercises.length - 1 ? 2 : 0 }}>
            <ExerciseIndex variant="body2">
              {exerciseIndex + 1}.
            </ExerciseIndex>
            <ExerciseContent>
              {mode === 'learn' ? (
                <LearnModeText text={exercise.sentence}/>
              ) : (
                <TextWithInputs
                  text={exercise.sentence}
                  exerciseIndex={`${block.id}_${exerciseIndex}`}
                  validationResults={validationResults}
                />
              )}
            </ExerciseContent>
          </ExerciseRow>
        ))}
      </ExerciseBlockInner>

      {mode === 'train' && (
        <CheckButtonBox>
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
        </CheckButtonBox>
      )}
    </ExerciseBlockContainer>
  );
};

export default ExerciseBlock;
