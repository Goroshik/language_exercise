/**
 * The load and save steps of useAIModelSelector. They report through a sink
 * object rather than calling setState directly, which is what lets them be
 * tested without rendering the hook.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AvailableModelsResponse } from 'src/services/aiModelsClient';

const loadAiModelOptions = vi.fn();
const saveAiModel = vi.fn();
const alertError = vi.fn();

vi.mock('src/services/aiModelsClient', async importOriginal => {
  const actual = await importOriginal<typeof import('src/services/aiModelsClient')>();
  return {
    ...actual,
    loadAiModelOptions: (...a: unknown[]) => loadAiModelOptions(...a),
    saveAiModel: (...a: unknown[]) => saveAiModel(...a)
  };
});

vi.mock('src/utils/alert', () => ({
  showAlert: { error: (...a: unknown[]) => alertError(...a) }
}));

const { loadOptionsInto, submitModel } = await import('./useAIModelSelector');

const AVAILABLE: AvailableModelsResponse = {
  providers: ['gemini', 'openai'],
  models: [],
  hasTokens: true
};

const makeSink = () => ({
  setLoading: vi.fn(),
  setError: vi.fn(),
  setSuccess: vi.fn(),
  setAvailableData: vi.fn(),
  setCurrentModel: vi.fn(),
  setField: vi.fn()
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  loadAiModelOptions.mockResolvedValue({ available: AVAILABLE, savedModel: 'gpt-5' });
  saveAiModel.mockResolvedValue(undefined);
});

describe('loadOptionsInto', () => {
  it('publishes the provider list', async () => {
    const sink = makeSink();
    await loadOptionsInto(sink);
    expect(sink.setAvailableData).toHaveBeenCalledWith(AVAILABLE);
  });

  it('preselects the saved model and its provider', async () => {
    const sink = makeSink();
    await loadOptionsInto(sink);

    expect(sink.setCurrentModel).toHaveBeenCalledWith('gpt-5');
    expect(sink.setField).toHaveBeenCalledWith('provider', 'openai');
    expect(sink.setField).toHaveBeenCalledWith('model', 'gpt-5');
  });

  it('falls back to the first available provider when the saved one is gone', async () => {
    loadAiModelOptions.mockResolvedValue({
      available: { ...AVAILABLE, providers: ['gemini'] },
      savedModel: 'gpt-5'
    });
    const sink = makeSink();
    await loadOptionsInto(sink);

    expect(sink.setField).toHaveBeenCalledWith('provider', 'gemini');
  });

  it('touches no form field when settings could not be read', async () => {
    loadAiModelOptions.mockResolvedValue({ available: AVAILABLE, savedModel: null });
    const sink = makeSink();
    await loadOptionsInto(sink);

    expect(sink.setAvailableData).toHaveBeenCalledWith(AVAILABLE);
    expect(sink.setField).not.toHaveBeenCalled();
    expect(sink.setCurrentModel).not.toHaveBeenCalled();
  });

  it('touches no form field when no provider is available at all', async () => {
    loadAiModelOptions.mockResolvedValue({
      available: { providers: [], models: [], hasTokens: false },
      savedModel: 'gpt-5'
    });
    const sink = makeSink();
    await loadOptionsInto(sink);

    expect(sink.setField).not.toHaveBeenCalled();
  });

  it('clears any previous error and success first', async () => {
    const sink = makeSink();
    await loadOptionsInto(sink);

    expect(sink.setError).toHaveBeenCalledWith('');
    expect(sink.setSuccess).toHaveBeenCalledWith('');
  });

  it('raises and lowers the loading flag', async () => {
    const sink = makeSink();
    await loadOptionsInto(sink);

    expect(sink.setLoading).toHaveBeenNthCalledWith(1, true);
    expect(sink.setLoading).toHaveBeenLastCalledWith(false);
  });

  it('reports a failure to the user', async () => {
    loadAiModelOptions.mockRejectedValue(new Error('offline'));
    const sink = makeSink();
    await loadOptionsInto(sink);

    expect(sink.setError).toHaveBeenLastCalledWith('Не удалось загрузить данные');
    expect(alertError).toHaveBeenCalledWith('Failed to load data');
  });

  it('lowers the loading flag even after a failure', async () => {
    loadAiModelOptions.mockRejectedValue(new Error('offline'));
    const sink = makeSink();
    await loadOptionsInto(sink);

    expect(sink.setLoading).toHaveBeenLastCalledWith(false);
  });
});

describe('submitModel', () => {
  it('refuses an empty model without calling the API', async () => {
    const sink = makeSink();
    const onClose = vi.fn();

    await submitModel(sink, '', onClose);

    expect(sink.setError).toHaveBeenCalledWith('Пожалуйста, выберите модель');
    expect(saveAiModel).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('saves the model and confirms it', async () => {
    const sink = makeSink();
    await submitModel(sink, 'gpt-5', vi.fn());

    expect(saveAiModel).toHaveBeenCalledWith('gpt-5');
    expect(sink.setCurrentModel).toHaveBeenCalledWith('gpt-5');
    expect(sink.setSuccess).toHaveBeenCalledWith('Модель успешно сохранена!');
  });

  it('closes the dialog a moment later, not immediately', async () => {
    const onClose = vi.fn();
    await submitModel(makeSink(), 'gpt-5', onClose);

    expect(onClose).not.toHaveBeenCalled();
    await vi.runAllTimersAsync();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('reports a failed save and keeps the dialog open', async () => {
    saveAiModel.mockRejectedValue(new Error('offline'));
    const sink = makeSink();
    const onClose = vi.fn();

    await submitModel(sink, 'gpt-5', onClose);

    expect(sink.setError).toHaveBeenLastCalledWith('Не удалось сохранить модель');
    expect(alertError).toHaveBeenCalledWith('Failed to save model');
    await vi.runAllTimersAsync();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not report success when the save failed', async () => {
    saveAiModel.mockRejectedValue(new Error('offline'));
    const sink = makeSink();

    await submitModel(sink, 'gpt-5', vi.fn());

    expect(sink.setSuccess).not.toHaveBeenCalledWith('Модель успешно сохранена!');
  });
});
