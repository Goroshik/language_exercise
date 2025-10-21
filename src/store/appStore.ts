import {create} from 'zustand';
import {devtools} from 'zustand/middleware';

import {GRAMMAR_PROMPTS} from 'src/prompts';
import {ApiService} from 'src/services/apiService';
import {AppState, AppStore, DictionaryWord, ExerciseBlock, ValidationResults} from 'src/types';

export const useAppStore = create<AppStore>()(devtools((set, get) => ({
    // Initial state
    state: 'loading-topics',
    selectedTopic: '',
    selectedLanguageId: undefined,
    exerciseBlocks: [],
    error: '',
    validationResults: {},

    // Actions
    handleTopicSelect: async ({languageId, level = 'A1', selectedWords = [], mode = 'student'}: {
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
      // Save the last selected topic path
      const topicPath = urlPath.split('/exercises/')[1] || '';

      set({
        selectedTopic: topic,
        selectedLanguageId: languageId,
        state: 'loading-exercises',
        error: '',
        validationResults: {}
      });

      // Save to user settings
      try {
        await fetch('/api/settings', {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({lastSelectedTopic: topicPath})
        });
      } catch (error) {
        console.error('Failed to save last selected topic:', error);
      }

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
          // For student mode, sentences have **bold** words that will be converted to blanks by TextWithInputs for practice
          sentencesList = (data)
            .map((sentence: string) => ({sentence: sentence.trim(), correctAnswers: []}));
        } else {
          // For teacher mode, sentences have **bold** words for learning/viewing examples
          sentencesList = (data)
            .map((sentence: string) => ({sentence: sentence.trim(), correctAnswers: []}));
        }

        console.log('123123123123123123123123', data, sentencesList);

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

    generateMoreExercises: async ({languageId, level = 'A1', selectedWords = [], mode = 'student'}: {
      languageId?: string;
      level?: string;
      selectedWords?: DictionaryWord[];
      mode?: 'student' | 'teacher';
    } = {}) => {
      // Получаем topic из URL
      const urlPath = window.location.pathname;
      const topicRaw = urlPath.split('/').pop() || '';
      const topic = topicRaw.replace(/_/g, ' ');
      set({state: 'loading-exercises', error: ''});
      try {
        const data = await ApiService.generateText({mode, topic, languageId, level, selectedWords});

        console.log('responseJson', data);

        let newSentencesList;

        if (mode === 'student') {
          // For student mode, sentences have **bold** words that will be converted to blanks by TextWithInputs for practice
          newSentencesList = (data)
            .map((sentence: string) => ({sentence: sentence.trim(), correctAnswers: []}));
        } else {
          // For teacher mode, sentences have **bold** words for learning/viewing examples
          newSentencesList = (data)
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
      const {exerciseBlocks, selectedTopic, selectedLanguageId} = get();

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

        // Получаем название языка
        let languageName = 'English';
        if (selectedLanguageId) {
          try {
            const res = await fetch('/api/languages');
            const data = await res.json();
            const language = data.data?.find((lang: any) => lang.id === selectedLanguageId);
            if (language) {
              languageName = language.name;
            }
          } catch (error) {
            console.error('Failed to fetch language name:', error);
          }
        }

        // Собираем текст с ответами пользователя (используем textarea значения)
        const answersText = block.exercises.map((exercise, index) => {
          const textareaId = `textarea_${blockId}_${index}`;
          const userAnswer = userAnswers[textareaId] || '';
          return `${index + 1}. ${userAnswer}`;
        }).join('\n');

        // Вызываем API для проверки ответов (промпт формируется на сервере)
        const data = await ApiService.checkAnswers({
          topic: selectedTopic,
          answersText,
          languageName
        });

        const results: {
          [key: string]: {
            isCorrect: boolean;
            error?: string;
            incorrectTranslations?: string[];
          };
        } = {};

        data.forEach((rawLine: string, index: number) => {
          const textareaId = `textarea_${blockId}_${index}`;
          const normalizedLine = rawLine.replace(/^\d+[\.\)]\s*/, '').trim();

          if (!normalizedLine) {
            results[textareaId] = {
              isCorrect: false,
              error: 'Не удалось обработать ответ проверки'
            };
            return;
          }

          const segments = normalizedLine.split('|').map(part => part.trim());
          const isCorrect = segments.length === 1 && /^CORRECT$/i.test(segments[0]);

          let errorMessage: string | undefined;
          let incorrectTranslations: string[] | undefined;

          if (!isCorrect) {
            segments.forEach(segment => {
              if (/^ERROR:/i.test(segment)) {
                const message = segment.replace(/^ERROR:\s*/i, '').trim();
                if (message) {
                  errorMessage = errorMessage ? `${errorMessage} ${message}`.trim() : message;
                }
              } else if (/^TRANSLATION_ERRORS:/i.test(segment)) {
                const errorsText = segment.replace(/^TRANSLATION_ERRORS:\s*/i, '').trim();
                if (errorsText) {
                  incorrectTranslations = errorsText
                    .split(/,\s*/)
                    .map(item => item.trim())
                    .filter(Boolean);
                } else {
                  incorrectTranslations = [];
                }
              }
            });
          }

          results[textareaId] = {
            isCorrect,
            ...(errorMessage ? {error: errorMessage} : {}),
            ...(incorrectTranslations && incorrectTranslations.length > 0
              ? {incorrectTranslations}
              : {})
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
    },

    loadLastSelectedTopic: async () => {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        const lastTopic = data.lastSelectedTopic || '';
        set({lastSelectedTopicPath: lastTopic});
        return lastTopic;
      } catch (error) {
        console.error('Failed to load last selected topic:', error);
        return '';
      }
    }
  }))
);
