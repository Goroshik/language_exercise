import {create} from 'zustand';
import {devtools} from "zustand/middleware";

import {AppState, ExerciseBlock, ValidationResults} from 'src/types';
import {GRAMMAR_PROMPTS} from 'src/prompts';

interface AppStore {
  // State
  state: AppState;
  selectedTopic: string;
  exerciseBlocks: ExerciseBlock[];
  error: string;
  validationResults: ValidationResults;

  // Actions
  handleTopicSelect: (topic: string, mode?: 'learn' | 'train', level?: string, selectedWords?: string[]) => Promise<void>;
  generateMoreExercises: (mode?: 'learn' | 'train', level?: string, selectedWords?: string[]) => Promise<void>;
  handleCheckAnswers: (blockId: string, userAnswers: { [key: string]: string }) => Promise<void>;
  clearError: () => void;
}

export const useAppStore = create<AppStore>()(devtools((set, get) => ({
  // Initial state
  state: 'loading-topics',
  selectedTopic: '',
  exerciseBlocks: [],
  error: '',
  validationResults: {},

  // Actions
  handleTopicSelect: async (topic: string, mode: 'learn' | 'train' = 'train', level: string = 'A1', selectedWords?: string[]) => {
    set({
      selectedTopic: topic,
      state: 'loading-exercises',
      error: '',
      validationResults: {}
    });

    try {
      const prompt = mode === 'learn'
        ? GRAMMAR_PROMPTS.generateTeacherSentences(topic, level, selectedWords)
        : GRAMMAR_PROMPTS.generateExercises(topic, selectedWords);

      const apiResponse = await fetch('/api/ai/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const responseJson = await apiResponse.json();

      if (!responseJson.success || responseJson.data?.error) {
        set({error: responseJson.data?.error || 'Ошибка генерации текста', state: 'topic-selection'});
      } else {
        let sentencesList;

        if (mode === 'learn') {
          // For learn mode, sentences don't have {{input}} placeholders, they have **bold** words
          sentencesList = responseJson.data.text.split('\n')
            .filter(line => line.trim())
            .map(sentence => ({sentence: sentence.trim(), correctAnswers: []}));
        } else {
          // For train mode, filter sentences with {{input}} placeholders
          sentencesList = responseJson.data.text.split('\n')
            .filter(line => line.trim() && line.includes('{{input}}'))
            .map(sentence => ({sentence: sentence.trim(), correctAnswers: []}));
        }

        const newBlock: ExerciseBlock = {
          id: `block_${Date.now()}`,
          exercises: sentencesList,
          createdAt: new Date(),
          isChecking: false
        };

        set(state => ({
          exerciseBlocks: [...state.exerciseBlocks, newBlock],
          state: 'exercises'
        }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      set({
        error: `Ошибка при загрузке упражнений: ${errorMessage}`,
        state: 'topic-selection'
      });
    }
  },

  generateMoreExercises: async (mode: 'learn' | 'train' = 'train', level: string = 'A1', selectedWords?: string[]) => {
    const {selectedTopic} = get();

    set({state: 'loading-exercises', error: ''});

    try {
      const prompt = mode === 'learn'
        ? GRAMMAR_PROMPTS.generateTeacherSentences(selectedTopic, level, selectedWords)
        : GRAMMAR_PROMPTS.generateMoreExercises(selectedTopic, selectedWords);

      const apiResponse = await fetch('/api/ai/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const responseJson = await apiResponse.json();

      if (!responseJson.success || responseJson.data?.error) {
        set({error: responseJson.data?.error || 'Ошибка генерации текста'});
      } else {
        let newSentencesList;

        if (mode === 'learn') {
          // For learn mode, sentences don't have {{input}} placeholders, they have **bold** words
          newSentencesList = responseJson.data.text.split('\n')
            .filter(line => line.trim())
            .map(sentence => ({sentence: sentence.trim(), correctAnswers: []}));
        } else {
          // For train mode, filter sentences with {{input}} placeholders
          newSentencesList = responseJson.data.text.split('\n')
            .filter(line => line.trim() && line.includes('{{input}}'))
            .map(sentence => ({sentence: sentence.trim(), correctAnswers: []}));
        }

        const newBlock: ExerciseBlock = {
          id: `block_${Date.now()}`,
          exercises: newSentencesList,
          createdAt: new Date(),
          isChecking: false
        };

        set(state => ({
          exerciseBlocks: [...state.exerciseBlocks, newBlock]
        }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      set({error: `Ошибка при загрузке дополнительных упражнений: ${errorMessage}`});
    } finally {
      set({state: 'exercises'});
    }
  },

  handleCheckAnswers: async (blockId: string, userAnswers: { [key: string]: string }) => {
    const {exerciseBlocks, selectedTopic} = get();

    // Set checking state for specific block
    set(state => ({
      exerciseBlocks: state.exerciseBlocks.map(block =>
        block.id === blockId ? {...block, isChecking: true} : block
      ),
      error: ''
    }));

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

      const validatePrompt = GRAMMAR_PROMPTS.validateAnswers(selectedTopic, answersText);
      const apiResponse = await fetch('/api/ai/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: validatePrompt })
      });
      const responseJson = await apiResponse.json();

      if (!responseJson.success || responseJson.data?.error) {
        set({error: responseJson.data?.error || 'Ошибка проверки ответов'});
      } else {
        const results: { [key: string]: { isCorrect: boolean; error?: string } } = {};
        const lines = responseJson.data.text.split('\n').filter(line => line.trim());

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

        set(state => ({
          validationResults: {
            ...state.validationResults,
            [blockId]: results
          }
        }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      set({error: `Ошибка при проверке ответов: ${errorMessage}`});
    } finally {
      // Remove checking state for specific block
      set(state => ({
        exerciseBlocks: state.exerciseBlocks.map(block =>
          block.id === blockId ? {...block, isChecking: false} : block
        )
      }));
    }
  },

  clearError: () => {
    set({error: ''});
  }
})));
