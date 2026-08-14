import { beforeEach, describe, expect, it, vi } from 'vitest';

const generateText = vi.fn();
const getTrainingExercises = vi.fn();
const checkAnswers = vi.fn();
const getUserAnswers = vi.fn();
const saveUserAnswer = vi.fn();
const alertError = vi.fn();
const alertSuccess = vi.fn();

vi.mock('src/services/apiService', () => ({
  ApiService: {
    generateText: (...a: unknown[]) => generateText(...a),
    getTrainingExercises: (...a: unknown[]) => getTrainingExercises(...a),
    checkAnswers: (...a: unknown[]) => checkAnswers(...a),
    getUserAnswers: (...a: unknown[]) => getUserAnswers(...a),
    saveUserAnswer: (...a: unknown[]) => saveUserAnswer(...a)
  }
}));

vi.mock('src/utils/alert', () => ({
  showAlert: {
    error: (...a: unknown[]) => alertError(...a),
    success: (...a: unknown[]) => alertSuccess(...a)
  }
}));

const store: Record<string, string> = {};
vi.stubGlobal('window', {
  location: { pathname: '/exercises/past_simple' },
  localStorage: {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    }
  }
});
vi.stubGlobal('localStorage', window.localStorage);

const { useAppStore } = await import('./appStore');

const INITIAL = useAppStore.getState();
const reset = () =>
  useAppStore.setState({
    state: 'loading-topics',
    selectedTopic: '',
    exerciseBlocks: [],
    error: '',
    validationResults: {},
    isNavigating: false,
    lastSelectedTopicPath: '',
    savedAnswers: {}
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  reset();
  generateText.mockResolvedValue({ data: ['Ona **czyta**.'], sentenceIds: ['s1'], hasAnswers: {} });
  getTrainingExercises.mockResolvedValue({ data: ['Historia.'], sentenceIds: ['s9'] });
  checkAnswers.mockResolvedValue([{ isCorrect: true }]);
  getUserAnswers.mockResolvedValue([]);
  saveUserAnswer.mockResolvedValue({});
});

describe('simple setters', () => {
  it('starts in the loading-topics state', () => {
    expect(INITIAL.state).toBe('loading-topics');
  });

  it('sets the navigating flag', () => {
    useAppStore.getState().setIsNavigating(true);
    expect(useAppStore.getState().isNavigating).toBe(true);
  });

  it('sets the app state', () => {
    useAppStore.getState().setState('exercises');
    expect(useAppStore.getState().state).toBe('exercises');
  });

  it('clears the error', () => {
    useAppStore.setState({ error: 'boom' });
    useAppStore.getState().clearError();
    expect(useAppStore.getState().error).toBe('');
  });

  it('exposes itself on window for non-hook callers', () => {
    expect(window.__appStore).toBe(useAppStore);
  });
});

describe('loadLastSelectedTopic', () => {
  it('returns an empty string when nothing is stored', async () => {
    delete store.lastSelectedTopicPath;
    await expect(useAppStore.getState().loadLastSelectedTopic()).resolves.toBe('');
  });

  it('returns and remembers the stored path', async () => {
    store.lastSelectedTopicPath = 'past_simple';
    await expect(useAppStore.getState().loadLastSelectedTopic()).resolves.toBe('past_simple');
    expect(useAppStore.getState().lastSelectedTopicPath).toBe('past_simple');
  });
});

describe('handleTopicSelect', () => {
  it('derives the topic from the url', async () => {
    await useAppStore.getState().handleTopicSelect();
    expect(useAppStore.getState().selectedTopic).toBe('past simple');
  });

  it('appends a block of exercises and shows them', async () => {
    await useAppStore.getState().handleTopicSelect();
    const { exerciseBlocks, state } = useAppStore.getState();
    expect(exerciseBlocks).toHaveLength(1);
    expect(exerciseBlocks[0]?.exercises[0]?.sentence).toBe('Ona **czyta**.');
    expect(state).toBe('exercises');
  });

  it('defaults to student mode and level A1', async () => {
    await useAppStore.getState().handleTopicSelect();
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'student', level: 'A1', topic: 'past simple' })
    );
  });

  it('passes the options through', async () => {
    await useAppStore
      .getState()
      .handleTopicSelect({ languageId: 'l1', level: 'B2', mode: 'teacher', sentenceCount: 7 });
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({ languageId: 'l1', level: 'B2', mode: 'teacher', sentenceCount: 7 })
    );
  });

  it('clears any previous validation results', async () => {
    useAppStore.setState({ validationResults: { b1: {} } });
    await useAppStore.getState().handleTopicSelect();
    expect(useAppStore.getState().validationResults).toEqual({});
  });

  it('loads saved answers in student mode', async () => {
    await useAppStore.getState().handleTopicSelect();
    expect(getUserAnswers).toHaveBeenCalledWith(['s1']);
  });

  it('does not load saved answers in teacher mode', async () => {
    await useAppStore.getState().handleTopicSelect({ mode: 'teacher' });
    expect(getUserAnswers).not.toHaveBeenCalled();
  });

  it('reports a failure and falls back to topic selection', async () => {
    generateText.mockRejectedValue(new Error('timeout'));
    await useAppStore.getState().handleTopicSelect();

    const { error, state } = useAppStore.getState();
    expect(error).toBe('Ошибка при загрузке упражнений: timeout');
    expect(state).toBe('topic-selection');
    expect(alertError).toHaveBeenCalledWith(error);
  });
});

describe('generateMoreExercises', () => {
  it('adds a second block, keeping the first', async () => {
    await useAppStore.getState().handleTopicSelect();
    await useAppStore.getState().generateMoreExercises();
    expect(useAppStore.getState().exerciseBlocks).toHaveLength(2);
  });

  it('leaves the selected topic alone', async () => {
    useAppStore.setState({ selectedTopic: 'kept' });
    await useAppStore.getState().generateMoreExercises();
    expect(useAppStore.getState().selectedTopic).toBe('kept');
  });

  it('stays on the exercises screen when it fails', async () => {
    generateText.mockRejectedValue(new Error('timeout'));
    await useAppStore.getState().generateMoreExercises();

    const { error, state } = useAppStore.getState();
    expect(error).toBe('Ошибка при загрузке дополнительных упражнений: timeout');
    expect(state).toBe('exercises');
  });
});

describe('loadTrainingExercises', () => {
  it('appends the sentences it got from history', async () => {
    await useAppStore.getState().loadTrainingExercises();
    expect(useAppStore.getState().exerciseBlocks[0]?.exercises[0]?.sentence).toBe('Historia.');
  });

  it('excludes the sentences already on the page', async () => {
    await useAppStore.getState().handleTopicSelect();
    await useAppStore.getState().loadTrainingExercises();
    expect(getTrainingExercises).toHaveBeenCalledWith(
      expect.objectContaining({ currentSentenceIds: ['s1'] })
    );
  });

  it('defaults the limit to five and the language to empty', async () => {
    await useAppStore.getState().loadTrainingExercises();
    expect(getTrainingExercises).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 5, languageId: '' })
    );
  });

  it('honours an explicit limit and language', async () => {
    await useAppStore.getState().loadTrainingExercises({ limit: 3, languageId: 'l1' });
    expect(getTrainingExercises).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 3, languageId: 'l1' })
    );
  });

  it('reports a failure and falls back to topic selection', async () => {
    getTrainingExercises.mockRejectedValue(new Error('empty'));
    await useAppStore.getState().loadTrainingExercises();

    const { error, state } = useAppStore.getState();
    expect(error).toBe('Ошибка при загрузке упражнений из истории: empty');
    expect(state).toBe('topic-selection');
  });
});

describe('handleCheckAnswers', () => {
  const withBlock = async () => {
    await useAppStore.getState().handleTopicSelect();
    const block = useAppStore.getState().exerciseBlocks[0];
    if (!block) throw new Error('expected a block to have been created');
    return block.id;
  };

  it('stores the verdicts against the block', async () => {
    const blockId = await withBlock();
    await useAppStore.getState().handleCheckAnswers(blockId, {});

    expect(useAppStore.getState().validationResults[blockId]).toEqual({
      [`textarea_${blockId}_0`]: { isCorrect: true }
    });
  });

  it('submits the answers the learner typed', async () => {
    const blockId = await withBlock();
    await useAppStore
      .getState()
      .handleCheckAnswers(blockId, { [`textarea_${blockId}_0`]: 'Ona czyta' });

    expect(checkAnswers).toHaveBeenCalledWith(
      expect.objectContaining({ exercises: [{ id: 's1', sentence: 'Ona czyta' }] })
    );
  });

  it('clears the checking flag afterwards', async () => {
    const blockId = await withBlock();
    await useAppStore.getState().handleCheckAnswers(blockId, {});
    expect(useAppStore.getState().exerciseBlocks[0]?.isChecking).toBe(false);
  });

  it('clears the checking flag even when checking fails', async () => {
    const blockId = await withBlock();
    checkAnswers.mockRejectedValue(new Error('nope'));
    await useAppStore.getState().handleCheckAnswers(blockId, {});
    expect(useAppStore.getState().exerciseBlocks[0]?.isChecking).toBe(false);
  });

  it('reports an unknown block', async () => {
    await useAppStore.getState().handleCheckAnswers('nope', {});
    expect(useAppStore.getState().error).toBe('Ошибка при проверке ответов: Block not found');
  });

  it('rejects a non-array response from the checker', async () => {
    const blockId = await withBlock();
    checkAnswers.mockResolvedValue({ nope: true });
    await useAppStore.getState().handleCheckAnswers(blockId, {});
    expect(useAppStore.getState().error).toContain('Некорректный ответ от сервера проверки');
  });

  it('keeps verdicts for other blocks', async () => {
    const blockId = await withBlock();
    useAppStore.setState({ validationResults: { other: {} } });
    await useAppStore.getState().handleCheckAnswers(blockId, {});
    expect(Object.keys(useAppStore.getState().validationResults)).toContain('other');
  });
});

describe('loadSavedAnswers', () => {
  it('does nothing for an empty list', async () => {
    await useAppStore.getState().loadSavedAnswers([]);
    expect(getUserAnswers).not.toHaveBeenCalled();
  });

  it('ignores blank ids', async () => {
    await useAppStore.getState().loadSavedAnswers(['', '']);
    expect(getUserAnswers).not.toHaveBeenCalled();
  });

  it('merges the answers it fetched into the store', async () => {
    getUserAnswers.mockResolvedValue([{ sentenceId: 's1', answer: 'Ona czyta' }]);
    await useAppStore.getState().loadSavedAnswers(['s1']);
    expect(useAppStore.getState().savedAnswers).toEqual({ s1: 'Ona czyta' });
  });

  it('keeps answers already in the store', async () => {
    useAppStore.setState({ savedAnswers: { s0: 'earlier' } });
    getUserAnswers.mockResolvedValue([{ sentenceId: 's1', answer: 'Ona czyta' }]);
    await useAppStore.getState().loadSavedAnswers(['s1']);
    expect(useAppStore.getState().savedAnswers).toEqual({ s0: 'earlier', s1: 'Ona czyta' });
  });

  it('swallows a fetch failure without setting an error', async () => {
    getUserAnswers.mockRejectedValue(new Error('offline'));
    await useAppStore.getState().loadSavedAnswers(['s1']);
    expect(useAppStore.getState().error).toBe('');
  });
});

describe('saveAnswer', () => {
  it('does nothing without a sentence id', async () => {
    await useAppStore.getState().saveAnswer('', 'x');
    expect(saveUserAnswer).not.toHaveBeenCalled();
  });

  it('saves and remembers the answer', async () => {
    await useAppStore.getState().saveAnswer('s1', 'Ona czyta');
    expect(saveUserAnswer).toHaveBeenCalledWith('s1', 'Ona czyta');
    expect(useAppStore.getState().savedAnswers.s1).toBe('Ona czyta');
  });

  it('confirms the save to the user', async () => {
    await useAppStore.getState().saveAnswer('s1', 'Ona czyta');
    expect(alertSuccess).toHaveBeenCalledWith('Ответ сохранен');
  });

  it('reports a failed save and keeps the old value', async () => {
    saveUserAnswer.mockRejectedValue(new Error('offline'));
    await useAppStore.getState().saveAnswer('s1', 'Ona czyta');

    expect(alertError).toHaveBeenCalledWith('Не удалось сохранить ответ');
    expect(useAppStore.getState().savedAnswers.s1).toBeUndefined();
  });
});
