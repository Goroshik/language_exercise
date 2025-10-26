import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { ApiService } from 'src/services/apiService';
import { AppStore, CheckAnswerItem, DictionaryWord, ExerciseBlock } from 'src/types';
import { showAlert } from 'src/utils/alert';

export const useAppStore = create<AppStore>()(
  devtools((set, get) => ({
    // Initial state
    state: 'loading-topics',
    selectedTopic: '',
    exerciseBlocks: [],
    error: '',
    validationResults: {},
    isNavigating: false,
    lastSelectedTopicPath: '',

    // Actions
    setIsNavigating: (isNavigating: boolean) => {
      set({ isNavigating });
    },

    setState: (state: AppStore['state']) => {
      set({ state });
    },

    loadLastSelectedTopic: async () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('lastSelectedTopicPath');
        if (stored) {
          set({ lastSelectedTopicPath: stored });
          return stored;
        }
      }
      return '';
    },

    handleTopicSelect: async ({
      languageId,
      level = 'A1',
      selectedWords = [],
      mode = 'student'
    }: {
      languageId?: string;
      level?: string;
      selectedWords?: DictionaryWord[];
      mode?: 'student' | 'teacher';
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
        const data = await ApiService.generateText({
          mode,
          topic,
          languageId,
          level,
          selectedWords
        });

        let sentencesList;

        if (mode === 'student') {
          // For student mode, sentences don't have {{input}} placeholders, they have **bold** words
          sentencesList = data.map((sentence: string) => ({
            sentence: sentence.trim(),
            correctAnswers: []
          }));
        } else {
          // For teacher mode, accept both formats: {{input}} and **bold**
          sentencesList = data.map((sentence: string) => ({
            sentence: sentence.trim(),
            correctAnswers: []
          }));
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
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
        showAlert.error(`Ошибка при загрузке упражнений: ${errorMessage}`);
        set({
          error: `Ошибка при загрузке упражнений: ${errorMessage}`,
          state: 'topic-selection'
        });
      }
    },

    generateMoreExercises: async ({
      languageId,
      level = 'A1',
      selectedWords = [],
      mode = 'student'
    }: {
      languageId?: string;
      level?: string;
      selectedWords?: DictionaryWord[];
      mode?: 'student' | 'teacher';
    } = {}) => {
      // Получаем topic из URL
      const urlPath = window.location.pathname;
      const topicRaw = urlPath.split('/').pop() || '';
      const topic = topicRaw.replace(/_/g, ' ');
      set({ state: 'loading-exercises', error: '' });
      try {
        const data = await ApiService.generateText({
          mode,
          topic,
          languageId,
          level,
          selectedWords
        });

        let newSentencesList;

        if (mode === 'student') {
          // For student mode, sentences don't have {{input}} placeholders, they have **bold** words
          newSentencesList = data.map((sentence: string) => ({
            sentence: sentence.trim(),
            correctAnswers: []
          }));
        } else {
          // For teacher mode, accept both formats: {{input}} and **bold**
          newSentencesList = data.map((sentence: string) => ({
            sentence: sentence.trim(),
            correctAnswers: []
          }));
        }

        const newBlock: ExerciseBlock = {
          id: `block_${Date.now()}`,
          exercises: newSentencesList,
          createdAt: new Date(),
          isChecking: false
        };

        set(state => ({
          exerciseBlocks: [...state.exerciseBlocks, newBlock],
          state: 'exercises'
        }));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
        showAlert.error(`Ошибка при загрузке дополнительных упражнений: ${errorMessage}`);
        set({
          error: `Ошибка при загрузке дополнительных упражнений: ${errorMessage}`,
          state: 'exercises'
        });
      }
    },

    handleCheckAnswers: async (blockId: string, userAnswers: { [key: string]: string }) => {
      const { exerciseBlocks, selectedTopic } = get();

      // Set checking state for specific block
      set(state => ({
        exerciseBlocks: state.exerciseBlocks.map(block =>
          block.id === blockId ? { ...block, isChecking: true } : block
        ),
        error: ''
      }));

      try {
        const block = exerciseBlocks.find(b => b.id === blockId);
        if (!block) {
          throw new Error('Block not found');
        }

        // Формируем массив предложений с ответами студента
        const sentencesWithAnswers = block.exercises.map((exercise, index) => {
          const textareaId = `textarea_${blockId}_${index}`;
          return userAnswers[textareaId] || '';
        });

        // Отправляем на бэк только предложения с ответами
        const data = await ApiService.checkAnswers({
          topic: selectedTopic,
          sentences: sentencesWithAnswers
        });

        const results: {
          [key: string]: {
            isCorrect: boolean;
            error?: string;
            incorrectTranslations?: string[];
          };
        } = {};

        // Обрабатываем структурированные результаты от AI
        (data as CheckAnswerItem[]).forEach((item, index) => {
          if (item.skipped) return; // Пропускаем пустые ответы

          const textareaId = `textarea_${blockId}_${index}`;
          results[textareaId] = {
            isCorrect: Boolean(item.isCorrect),
            error: item.grammarError,
            incorrectTranslations: item.translationErrors
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
        showAlert.error(`Ошибка при проверке ответов: ${errorMessage}`);
        set({ error: `Ошибка при проверке ответов: ${errorMessage}` });
      } finally {
        // Remove checking state for specific block
        set(state => ({
          exerciseBlocks: state.exerciseBlocks.map(block =>
            block.id === blockId ? { ...block, isChecking: false } : block
          )
        }));
      }
    },

    clearError: () => {
      set({ error: '' });
    }
  }))
);
