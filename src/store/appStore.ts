import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { ApiService } from 'src/services/apiService';
import { AppStore, CheckAnswerItem, DictionaryWord, Exercise } from 'src/types';
import { showAlert } from 'src/utils/alert';
import {
  answersToMap,
  buildAnswerPayload,
  buildValidationResults,
  collectSentenceIds,
  createExerciseBlock,
  describeError,
  exercisesFromResponse,
  markBlockChecking,
  topicFromPathname
} from './exerciseBlocks';

declare global {
  interface Window {
    __appStore?: typeof useAppStore;
  }
}

type Set = {
  (partial: Partial<AppStore>): void;
  (updater: (state: AppStore) => Partial<AppStore>): void;
};
type Get = () => AppStore;

interface GenerateOptions {
  languageId?: string;
  level?: string;
  selectedWords?: DictionaryWord[];
  mode?: 'student' | 'teacher';
  customTopic?: string;
  sentenceCount?: number;
}

interface TrainingOptions {
  languageId?: string;
  level?: string;
  mode?: 'student' | 'teacher';
  limit?: number;
}

const INITIAL_STATE = {
  state: 'loading-topics' as AppStore['state'],
  selectedTopic: '',
  exerciseBlocks: [],
  error: '',
  validationResults: {},
  isNavigating: false,
  lastSelectedTopicPath: '',
  savedAnswers: {}
};

/** All three loaders finish the same way: append a block and show it. */
function appendBlock(set: Set, exercises: Exercise[]): void {
  const block = createExerciseBlock(exercises, new Date());
  set(state => ({
    exerciseBlocks: [...state.exerciseBlocks, block],
    state: 'exercises'
  }));
}

/** Saved answers only exist in student mode, where the learner types them. */
function loadAnswersForStudent(get: Get, mode: string, sentenceIds: string[]): void {
  if (mode === 'student') {
    void get().loadSavedAnswers(sentenceIds);
  }
}

const handleTopicSelect =
  (set: Set, get: Get) =>
  async (options: GenerateOptions = {}) => {
    const { mode = 'student', level = 'A1', selectedWords = [] } = options;
    const topic = topicFromPathname(window.location.pathname);

    set({ selectedTopic: topic, state: 'loading-exercises', error: '', validationResults: {} });

    try {
      const response = await ApiService.generateText({
        mode,
        topic,
        level,
        selectedWords,
        languageId: options.languageId,
        customTopic: options.customTopic,
        sentenceCount: options.sentenceCount
      });

      const { exercises, sentenceIds } = exercisesFromResponse(response);
      appendBlock(set, exercises);
      loadAnswersForStudent(get, mode, sentenceIds);
    } catch (err) {
      const message = describeError(err, 'Ошибка при загрузке упражнений');
      showAlert.error(message);
      set({ error: message, state: 'topic-selection' });
    }
  };

const generateMoreExercises =
  (set: Set, get: Get) =>
  async (options: GenerateOptions = {}) => {
    const { mode = 'student', level = 'A1', selectedWords = [] } = options;
    const topic = topicFromPathname(window.location.pathname);

    set({ state: 'loading-exercises', error: '' });

    try {
      const response = await ApiService.generateText({
        mode,
        topic,
        level,
        selectedWords,
        languageId: options.languageId,
        customTopic: options.customTopic,
        sentenceCount: options.sentenceCount
      });

      const { exercises, sentenceIds } = exercisesFromResponse(response);
      appendBlock(set, exercises);
      loadAnswersForStudent(get, mode, sentenceIds);
    } catch (err) {
      const message = describeError(err, 'Ошибка при загрузке дополнительных упражнений');
      showAlert.error(message);
      set({ error: message, state: 'exercises' });
    }
  };

const loadTrainingExercises =
  (set: Set, get: Get) =>
  async (options: TrainingOptions = {}) => {
    const { mode = 'student', level = 'A1', limit = 5, languageId = '' } = options;
    const topic = topicFromPathname(window.location.pathname);
    const currentSentenceIds = collectSentenceIds(get().exerciseBlocks);

    set({ selectedTopic: topic, state: 'loading-exercises', error: '' });

    try {
      const response = await ApiService.getTrainingExercises({
        topic,
        languageId,
        level,
        limit,
        currentSentenceIds
      });

      const { exercises, sentenceIds } = exercisesFromResponse(response);
      appendBlock(set, exercises);
      loadAnswersForStudent(get, mode, sentenceIds);
    } catch (err) {
      const message = describeError(err, 'Ошибка при загрузке упражнений из истории');
      showAlert.error(message);
      set({ error: message, state: 'topic-selection' });
    }
  };

const handleCheckAnswers =
  (set: Set, get: Get) => async (blockId: string, userAnswers: Record<string, string>) => {
    const { exerciseBlocks, selectedTopic } = get();

    set(state => ({
      exerciseBlocks: markBlockChecking(state.exerciseBlocks, blockId, true),
      error: ''
    }));

    try {
      const block = exerciseBlocks.find(b => b.id === blockId);
      if (!block) {
        throw new Error('Block not found');
      }

      const data = await ApiService.checkAnswers({
        topic: selectedTopic,
        exercises: buildAnswerPayload(blockId, block.exercises, userAnswers)
      });

      if (!Array.isArray(data)) {
        throw new Error('Некорректный ответ от сервера проверки');
      }

      const results = buildValidationResults(blockId, data as CheckAnswerItem[]);
      set(state => ({
        validationResults: { ...state.validationResults, [blockId]: results }
      }));
    } catch (err) {
      const message = describeError(err, 'Ошибка при проверке ответов');
      showAlert.error(message);
      set({ error: message });
    } finally {
      set(state => ({
        exerciseBlocks: markBlockChecking(state.exerciseBlocks, blockId, false)
      }));
    }
  };

const loadLastSelectedTopic = (set: Set) => async (): Promise<string> => {
  if (typeof window === 'undefined') return '';

  const stored = localStorage.getItem('lastSelectedTopicPath');
  if (!stored) return '';

  set({ lastSelectedTopicPath: stored });
  return stored;
};

const loadSavedAnswers = (set: Set, get: Get) => async (sentenceIds: string[]) => {
  const validIds = sentenceIds.filter(id => id);
  if (validIds.length === 0) return;

  try {
    const answers = await ApiService.getUserAnswers(validIds);
    set({ savedAnswers: { ...get().savedAnswers, ...answersToMap(answers) } });
  } catch (err) {
    console.error('Failed to load saved answers:', err);
  }
};

const saveAnswer = (set: Set, get: Get) => async (sentenceId: string, answer: string) => {
  if (!sentenceId) return;

  try {
    await ApiService.saveUserAnswer(sentenceId, answer);
    set({ savedAnswers: { ...get().savedAnswers, [sentenceId]: answer } });
    showAlert.success('Ответ сохранен');
  } catch (err) {
    console.error('Failed to save answer:', err);
    showAlert.error('Не удалось сохранить ответ');
  }
};

export const useAppStore = create<AppStore>()(
  devtools((set, get) => ({
    ...INITIAL_STATE,

    setIsNavigating: (isNavigating: boolean) => set({ isNavigating }),
    setState: (state: AppStore['state']) => set({ state }),
    clearError: () => set({ error: '' }),

    loadLastSelectedTopic: loadLastSelectedTopic(set),
    handleTopicSelect: handleTopicSelect(set, get),
    generateMoreExercises: generateMoreExercises(set, get),
    loadTrainingExercises: loadTrainingExercises(set, get),
    handleCheckAnswers: handleCheckAnswers(set, get),
    loadSavedAnswers: loadSavedAnswers(set, get),
    saveAnswer: saveAnswer(set, get)
  }))
);

// Expose store globally for components that cannot use hooks.
if (typeof window !== 'undefined') {
  window.__appStore = useAppStore;
}
