import {create} from 'zustand';
import {devtools} from "zustand/middleware";

import {GRAMMAR_PROMPTS} from 'src/prompts';
import {ApiService} from 'src/services/apiService';
import {AppState, AppStore, DictionaryWord, ExerciseBlock, ValidationResults} from 'src/types';

export const useAppStore = create<AppStore>()(devtools((set, get) => ({
  // Initial state
  state: 'loading-topics',
  selectedTopic: '',
  exerciseBlocks: [],
  error: '',
  validationResults: {},

  // Actions
  handleTopicSelect: async ({language = 'English', level = 'A1', selectedWords = [], mode = 'train'}: {
    language?: string;
    level?: string;
    selectedWords?: DictionaryWord[];
    mode?: 'learn' | 'train';
  } = {}) => {
    // Получаем topic из URL
    const urlPath = window.location.pathname;
    // Предполагаем, что topic — последний сегмент после /exercises/
    const topicRaw = urlPath.split('/').pop() || '';
    const topic = topicRaw.replace(/_/g, ' ');
    set({
      selectedTopic: topic,
      state: 'loading-exercises',
      error: '',
      validationResults: {}
    });

    try {
      const data = await ApiService.generateText({mode, topic, language, level, selectedWords});


      let sentencesList;

      if (mode === 'learn') {
        // For learn mode, sentences don't have {{input}} placeholders, they have **bold** words
        sentencesList = (data)
          .map((sentence: string) => ({sentence: sentence.trim(), correctAnswers: []}));
      } else {
        // For train mode, filter sentences with {{input}} placeholders
        sentencesList = (data)
          .filter((sentence: string) => sentence.includes('{{input}}'))
          .map((sentence: string) => ({sentence: sentence.trim(), correctAnswers: []}));
      }

      console.log('123123123123123123123123', data, sentencesList)

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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      set({
        error: `Ошибка при загрузке упражнений: ${errorMessage}`,
        state: 'topic-selection'
      });
    }
  },

  generateMoreExercises: async ({language = 'English', level = 'A1', selectedWords = [], mode = 'train'}: {
    language?: string;
    level?: string;
    selectedWords?: DictionaryWord[];
    mode?: 'learn' | 'train';
  } = {}) => {
    // Получаем topic из URL
    const urlPath = window.location.pathname;
    const topicRaw = urlPath.split('/').pop() || '';
    const topic = topicRaw.replace(/_/g, ' ');
    set({state: 'loading-exercises', error: ''});
    try {
      const data = await ApiService.generateText({mode, topic, language, level, selectedWords});

      console.log('responseJson', data)

      let newSentencesList;

      if (mode === 'learn') {
        // For learn mode, sentences don't have {{input}} placeholders, they have **bold** words
        newSentencesList = (data)
          .map((sentence: string) => ({sentence: sentence.trim(), correctAnswers: []}));
      } else {
        // For train mode, filter sentences with {{input}} placeholders
        newSentencesList = (data)
          .filter((sentence: string) => sentence.includes('{{input}}'))
          .map((sentence: string) => ({sentence: sentence.trim(), correctAnswers: []}));
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

      // Build the answers text for validation - each exercise with user's answer
      const answersText = block.exercises.map((exercise, index) => {
        const textareaId = `textarea_${blockId}_${index}`;
        const userAnswer = userAnswers[textareaId] || '';
        return `${index + 1}. ${userAnswer}`;
      }).join('\n');
      
      const validatePrompt = GRAMMAR_PROMPTS.validateAnswers(selectedTopic, answersText);
      const data = await ApiService.generateText({prompt: validatePrompt});

      const results: { [key: string]: { isCorrect: boolean; error?: string; incorrectTranslations?: string[] } } = {};

      data.forEach((line: string, index: number) => {
        const textareaId = `textarea_${blockId}_${index}`;
        
        const isCorrect = line.includes('CORRECT') && !line.includes('ERROR') && !line.includes('TRANSLATION_ERRORS');
        let errorMessage: string | undefined;
        let incorrectTranslations: string[] | undefined;

        // Parse grammar errors
        if (line.includes('ERROR:')) {
          const errorMatch = line.match(/ERROR:\s*([^|]+)/);
          if (errorMatch) {
            errorMessage = errorMatch[1].trim();
          }
        }

        // Parse translation errors
        if (line.includes('TRANSLATION_ERRORS:')) {
          const translationMatch = line.match(/TRANSLATION_ERRORS:\s*(.+)/);
          if (translationMatch) {
            const translationErrorsStr = translationMatch[1].trim();
            // Split by comma and clean up
            incorrectTranslations = translationErrorsStr
              .split(',')
              .map(item => item.trim())
              .filter(item => item.length > 0);
          }
        }

        results[textareaId] = {
          isCorrect,
          error: errorMessage,
          incorrectTranslations
        };
      });

      set(state => ({
        validationResults: {
          ...state.validationResults,
          [blockId]: results
        }
      }));
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
