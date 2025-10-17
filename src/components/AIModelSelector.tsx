'use client'

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import { AIModel, PROVIDER_LABELS, getModelsByProvider, getProviderFromModel } from 'src/constants/aiModels';

interface AIModelSelectorProps {
  open: boolean;
  onClose: () => void;
}

interface AvailableModelsResponse {
  providers: Array<'gemini' | 'openai' | 'anthropic'>;
  models: AIModel[];
  hasTokens: boolean;
}

interface FormData {
  provider: 'gemini' | 'openai' | 'anthropic' | '';
  model: string;
}

const AIModelSelector: React.FC<AIModelSelectorProps> = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [availableData, setAvailableData] = useState<AvailableModelsResponse>({
    providers: [],
    models: [],
    hasTokens: false
  });
  const [currentModel, setCurrentModel] = useState<string>('');

  const { control, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      provider: '',
      model: ''
    }
  });

  const selectedProvider = watch('provider');
  const selectedModel = watch('model');

  // Load available models and current settings
  useEffect(() => {
    if (open) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Handle provider change - auto-select first model
  useEffect(() => {
    if (selectedProvider) {
      const providerModels = getModelsByProvider(selectedProvider);
      if (providerModels.length > 0 && !providerModels.find(m => m.value === selectedModel)) {
        setValue('model', providerModels[0].value);
      }
    }
  }, [selectedProvider, selectedModel, setValue]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Load available models and current settings in parallel
      const [modelsResponse, settingsResponse] = await Promise.all([
        fetch('/api/ai/available-models'),
        fetch('/api/settings')
      ]);
      
      if (!modelsResponse.ok) {
        throw new Error('Failed to fetch available models');
      }
      
      const modelsData: AvailableModelsResponse = await modelsResponse.json();
      setAvailableData(modelsData);
      
      if (settingsResponse.ok) {
        const settings = await settingsResponse.json();
        const currentAiModel = settings.aiModel || 'gemini-2.5-flash';
        setCurrentModel(currentAiModel);
        
        // Initialize form with current or default provider/model
        const provider = getProviderFromModel(currentAiModel);
        if (provider && modelsData.providers.includes(provider)) {
          setValue('provider', provider);
          setValue('model', currentAiModel);
        } else if (modelsData.providers.length > 0) {
          const defaultProvider = modelsData.providers[0];
          setValue('provider', defaultProvider);
          const providerModels = getModelsByProvider(defaultProvider);
          if (providerModels.length > 0) {
            setValue('model', providerModels[0].value);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!data.model) {
      setError('Пожалуйста, выберите модель');
      return;
    }
    
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aiModel: data.model
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      setCurrentModel(data.model);
      setSuccess('Модель успешно сохранена!');
      
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Failed to save model:', error);
      setError('Не удалось сохранить модель');
    }
  };

  const getFilteredModels = (): AIModel[] => {
    if (!selectedProvider) return [];
    return getModelsByProvider(selectedProvider);
  };

  const isProviderDisabled = availableData.providers.length === 1;
  const isModelDisabled = !selectedProvider || getFilteredModels().length === 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Выбор AI модели</DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {!availableData.hasTokens ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                У вас нет добавленных токенов. Пожалуйста, добавьте токен в настройках, чтобы использовать AI модели.
              </Alert>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)}>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Выберите AI модель для генерации текста. Доступны только модели, для которых добавлен токен.
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                  </Alert>
                )}

                <Controller
                  name="provider"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Провайдер</InputLabel>
                      <Select
                        {...field}
                        disabled={isProviderDisabled || isSubmitting}
                        label="Провайдер"
                      >
                        {availableData.providers.map((provider) => (
                          <MenuItem key={provider} value={provider}>
                            {PROVIDER_LABELS[provider]}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />

                <Controller
                  name="model"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Модель</InputLabel>
                      <Select
                        {...field}
                        disabled={isModelDisabled || isSubmitting}
                        label="Модель"
                      >
                        {getFilteredModels().map((model) => (
                          <MenuItem key={model.value} value={model.value}>
                            {model.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />

                {currentModel && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Текущая модель:
                    </Typography>
                    <Typography variant="body2">
                      {availableData.models.find(m => m.value === currentModel)?.label || currentModel}
                    </Typography>
                  </Box>
                )}
              </form>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Отмена
        </Button>
        {availableData.hasTokens && (
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={loading || isSubmitting || !selectedModel || selectedModel === currentModel}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting ? 'Сохранение...' : 'Сохранить'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AIModelSelector;
