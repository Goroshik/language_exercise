import {useCallback, useState} from 'react';
import {AppState, ExerciseBlock, ValidationResults} from '../types';
import {GRAMMAR_PROMPTS} from '../prompts';
import GoogleAIService from '../services/googleAI';

export const useAppState = () => {
  const [state, setState] = useState<AppState>('loading-topics');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [exerciseBlocks, setExerciseBlocks] = useState<ExerciseBlock[]>([]);
  const [error, setError] = useState<string>('');
  const [validationResults, setValidationResults] = useState<ValidationResults>({});


  const handleTopicSelect = useCallback(async (topic: string, mode: 'learn' | 'train' = 'train', level: string = 'A1') => {
    setSelectedTopic(topic);
    setState('loading-exercises');
    setError('');
    setValidationResults({});

    try {
      const prompt = mode === 'learn'
        ? GRAMMAR_PROMPTS.generateTeacherSentences(topic, level)
        : GRAMMAR_PROMPTS.generateExercises(topic);

      const response = await GoogleAIService.generateText(prompt);

      if (response.error) {
        setError(response.error);
        setState('topic-selection');
      } else {
        let sentencesList;

        if (mode === 'learn') {
          // For learn mode, sentences don't have {{input}} placeholders, they have **bold** words
          sentencesList = response.text.split('\n')
            .filter(line => line.trim())
            .map(sentence => ({sentence: sentence.trim(), correctAnswers: []}));
        } else {
          // For train mode, filter sentences with {{input}} placeholders
          sentencesList = response.text.split('\n')
            .filter(line => line.trim() && line.includes('{{input}}'))
            .map(sentence => ({sentence: sentence.trim(), correctAnswers: []}));
        }

        const newBlock: ExerciseBlock = {
          id: `block_${Date.now()}`,
          exercises: sentencesList,
          createdAt: new Date(),
          isChecking: false
        };

        setExerciseBlocks(prevBlocks => [...prevBlocks, newBlock]);
        setState('exercises');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(`Ошибка при загрузке упражнений: ${errorMessage}`);
      setState('topic-selection');
    }
  }, []);

  const generateMoreExercises = useCallback(async (mode: 'learn' | 'train' = 'train', level: string = 'A1') => {
    setState('loading-exercises');
    setError('');

    try {
      const prompt = mode === 'learn'
        ? GRAMMAR_PROMPTS.generateTeacherSentences(selectedTopic, level)
        : GRAMMAR_PROMPTS.generateMoreExercises(selectedTopic);

      const response = await GoogleAIService.generateText(prompt);

      if (response.error) {
        setError(response.error);
      } else {
        let newSentencesList;

        if (mode === 'learn') {
          // For learn mode, sentences don't have {{input}} placeholders, they have **bold** words
          newSentencesList = response.text.split('\n')
            .filter(line => line.trim())
            .map(sentence => ({sentence: sentence.trim(), correctAnswers: []}));
        } else {
          // For train mode, filter sentences with {{input}} placeholders
          newSentencesList = response.text.split('\n')
            .filter(line => line.trim() && line.includes('{{input}}'))
            .map(sentence => ({sentence: sentence.trim(), correctAnswers: []}));
        }

        const newBlock: ExerciseBlock = {
          id: `block_${Date.now()}`,
          exercises: newSentencesList,
          createdAt: new Date(),
          isChecking: false
        };

        setExerciseBlocks(prevBlocks => [...prevBlocks, newBlock]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(`Ошибка при загрузке дополнительных упражнений: ${errorMessage}`);
    } finally {
      setState('exercises');
    }
  }, [selectedTopic]);

  const handleCheckAnswers = useCallback(async (blockId: string, userAnswers: { [key: string]: string }) => {
    setExerciseBlocks(prevBlocks =>
      prevBlocks.map(block =>
        block.id === blockId ? {...block, isChecking: true} : block
      )
    );
    setError('');

    try {
      const block = exerciseBlocks.find(b => b.id === blockId);
      if (!block) {
        throw new Error('Block not found');
      }

      const answersText = block.exercises.map((exercise, index) => {
        const inputRegex = /\{\{input\}\}/g;
        let inputCounter = 0;
        const filledSentence = exercise.sentence.replace(inputRegex, () => {
          const inputId = `input_${blockId}_${index}_${inputCounter++}`;
          return userAnswers[inputId] || '___';
        });
        return `${index + 1}. ${filledSentence}`;
      }).join('\n');

      const response = await GoogleAIService.generateText(
        GRAMMAR_PROMPTS.validateAnswers(selectedTopic, answersText)
      );

      if (response.error) {
        setError(response.error);
      } else {
        const results: { [key: string]: { isCorrect: boolean; error?: string } } = {};
        const lines = response.text.split('\n').filter(line => line.trim());

        lines.forEach((line, index) => {
          const isCorrect = line.includes('CORRECT');
          let errorMessage: string | undefined;

          if (!isCorrect && line.includes('ERROR:')) {
            errorMessage = line.replace(/^\d+\.\s*ERROR:\s*/, '').trim();
          }

          let inputCounter = 0;

          block.exercises[index]?.sentence.replace(/\{\{input\}\}/g, () => {
            const inputId = `input_${blockId}_${index}_${inputCounter++}`;
            results[inputId] = {isCorrect, error: errorMessage};
            return '';
          });
        });

        setValidationResults(prev => ({
          ...prev,
          [blockId]: results
        }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(`Ошибка при проверке ответов: ${errorMessage}`);
    } finally {
      setExerciseBlocks(prevBlocks =>
        prevBlocks.map(block =>
          block.id === blockId ? {...block, isChecking: false} : block
        )
      );
    }
  }, [exerciseBlocks, selectedTopic]);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  return {
    state,
    selectedTopic,
    exerciseBlocks,
    error,
    validationResults,
    handleTopicSelect,
    generateMoreExercises,
    handleCheckAnswers,
    clearError
  };
};
