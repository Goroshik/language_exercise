import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { AIModel } from 'src/constants/aiModels';
import {
  type AvailableModelsResponse,
  EMPTY_AVAILABLE,
  loadAiModelOptions,
  saveAiModel
} from 'src/services/aiModelsClient';
import {
  type Provider,
  modelsForProvider,
  nextModelForProvider,
  resolveInitialSelection
} from 'src/utils/aiModelSelection';
import { showAlert } from 'src/utils/alert';

const CLOSE_DELAY_MS = 1000;

export interface AIModelFormData {
  provider: Provider | '';
  model: string;
}

/** Everything the load and save steps need to report back into the component. */
export interface AIModelSink {
  setLoading: (value: boolean) => void;
  setError: (value: string) => void;
  setSuccess: (value: string) => void;
  setAvailableData: (value: AvailableModelsResponse) => void;
  setCurrentModel: (value: string) => void;
  setField: (field: keyof AIModelFormData, value: string) => void;
}

export async function loadOptionsInto(sink: AIModelSink): Promise<void> {
  sink.setLoading(true);
  sink.setError('');
  sink.setSuccess('');

  try {
    const { available, savedModel } = await loadAiModelOptions();
    sink.setAvailableData(available);
    if (savedModel === null) return;

    sink.setCurrentModel(savedModel);
    const selection = resolveInitialSelection(savedModel, available.providers);
    if (selection) {
      sink.setField('provider', selection.provider);
      sink.setField('model', selection.model);
    }
  } catch (_error) {
    showAlert.error('Failed to load data');
    sink.setError('Не удалось загрузить данные');
  } finally {
    sink.setLoading(false);
  }
}

export async function submitModel(
  sink: AIModelSink,
  model: string,
  onClose: () => void
): Promise<void> {
  if (!model) {
    sink.setError('Пожалуйста, выберите модель');
    return;
  }

  sink.setError('');
  sink.setSuccess('');

  try {
    await saveAiModel(model);
    sink.setCurrentModel(model);
    sink.setSuccess('Модель успешно сохранена!');
    setTimeout(onClose, CLOSE_DELAY_MS);
  } catch (_error) {
    showAlert.error('Failed to save model');
    sink.setError('Не удалось сохранить модель');
  }
}

/**
 * State and effects behind AIModelSelector. The decisions live in
 * utils/aiModelSelection and services/aiModelsClient, which are tested directly.
 */
export function useAIModelSelector(open: boolean, onClose: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [availableData, setAvailableData] = useState<AvailableModelsResponse>(EMPTY_AVAILABLE);
  const [currentModel, setCurrentModel] = useState<string>('');

  const form = useForm<AIModelFormData>({ defaultValues: { provider: '', model: '' } });
  const { control, handleSubmit, watch, setValue } = form;
  const selectedProvider = watch('provider');
  const selectedModel = watch('model');

  const sink: AIModelSink = {
    setLoading,
    setError,
    setSuccess,
    setAvailableData,
    setCurrentModel,
    setField: (field, value) => setValue(field, value)
  };

  const loadData = useCallback(() => loadOptionsInto(sink), [setValue]);
  const onSubmit = useCallback(
    (data: AIModelFormData) => submitModel(sink, data.model, onClose),
    [onClose, setValue]
  );

  useEffect(() => {
    if (open) void loadData();
  }, [open, loadData]);

  // Keep the model in step with the provider the user picked.
  useEffect(() => {
    if (!selectedProvider) return;

    const next = nextModelForProvider(selectedProvider, selectedModel);
    if (next) setValue('model', next);
  }, [selectedProvider, selectedModel, setValue]);

  const filteredModels: AIModel[] = modelsForProvider(selectedProvider);

  return {
    control,
    handleSubmit,
    onSubmit,
    loading,
    error,
    success,
    isSubmitting: form.formState.isSubmitting,
    availableData,
    currentModel,
    selectedModel,
    filteredModels,
    isProviderDisabled: availableData.providers.length === 1,
    isModelDisabled: !selectedProvider || filteredModels.length === 0
  };
}
