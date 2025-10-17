'use client'

import React, { useState, useEffect } from 'react';
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
  Divider
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
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

const AIModelSelector: React.FC<AIModelSelectorProps> = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  const [availableData, setAvailableData] = useState<AvailableModelsResponse>({
    providers: [],
    models: [],
    hasTokens: false
  });
  
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'openai' | 'anthropic' | ''>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [currentModel, setCurrentModel] = useState<string>('');

  // Load available models and current settings
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Load available models based on tokens
      const modelsResponse = await fetch('/api/ai/available-models');
      if (!modelsResponse.ok) {
        throw new Error('Failed to fetch available models');
      }
      const modelsData: AvailableModelsResponse = await modelsResponse.json();
      setAvailableData(modelsData);
      
      // Load current settings
      const settingsResponse = await fetch('/api/settings');
      if (settingsResponse.ok) {
        const settings = await settingsResponse.json();
        const currentAiModel = settings.aiModel || 'gemini-2.5-flash';
        setCurrentModel(currentAiModel);
        
        // Set provider based on current model
        const provider = getProviderFromModel(currentAiModel);
        if (provider && modelsData.providers.includes(provider)) {
          // Current model's provider is available
          setSelectedProvider(provider);
          setSelectedModel(currentAiModel);
        } else if (modelsData.providers.length === 1) {
          // Auto-select if only one provider available
          setSelectedProvider(modelsData.providers[0]);
          // Auto-select first model of that provider
          const providerModels = getModelsByProvider(modelsData.providers[0]);
          if (providerModels.length > 0) {
            setSelectedModel(providerModels[0].value);
          }
        } else if (modelsData.providers.length > 1) {
          // Multiple providers available, select first one
          setSelectedProvider(modelsData.providers[0]);
          const providerModels = getModelsByProvider(modelsData.providers[0]);
          if (providerModels.length > 0) {
            setSelectedModel(providerModels[0].value);
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

  const handleProviderChange = (event: SelectChangeEvent) => {
    const provider = event.target.value as 'gemini' | 'openai' | 'anthropic';
    setSelectedProvider(provider);
    
    // Auto-select first model of the provider
    const providerModels = getModelsByProvider(provider);
    if (providerModels.length > 0) {
      setSelectedModel(providerModels[0].value);
    } else {
      setSelectedModel('');
    }
    
    setError('');
    setSuccess('');
  };

  const handleModelChange = (event: SelectChangeEvent) => {
    setSelectedModel(event.target.value);
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!selectedModel) {
      setError('Пожалуйста, выберите модель');
      return;
    }
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aiModel: selectedModel
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      setCurrentModel(selectedModel);
      setSuccess('Модель успешно сохранена!');
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Failed to save model:', error);
      setError('Не удалось сохранить модель');
    } finally {
      setSaving(false);
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
              <>
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

                <FormControl fullWidth margin="normal">
                  <InputLabel>Провайдер</InputLabel>
                  <Select
                    value={selectedProvider}
                    onChange={handleProviderChange}
                    disabled={isProviderDisabled || saving}
                    label="Провайдер"
                  >
                    {availableData.providers.map((provider) => (
                      <MenuItem key={provider} value={provider}>
                        {PROVIDER_LABELS[provider]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                  <InputLabel>Модель</InputLabel>
                  <Select
                    value={selectedModel}
                    onChange={handleModelChange}
                    disabled={isModelDisabled || saving}
                    label="Модель"
                  >
                    {getFilteredModels().map((model) => (
                      <MenuItem key={model.value} value={model.value}>
                        {model.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

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
              </>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Отмена
        </Button>
        {availableData.hasTokens && (
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={loading || saving || !selectedModel || selectedModel === currentModel}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AIModelSelector;
