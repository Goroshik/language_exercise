'use client';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import React from 'react';
import { Controller } from 'react-hook-form';
import { PROVIDER_LABELS } from 'src/constants/aiModels';
import { useAIModelSelector } from 'src/hooks/useAIModelSelector';

interface AIModelSelectorProps {
  open: boolean;
  onClose: () => void;
}

const AIModelSelector: React.FC<AIModelSelectorProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const {
    control,
    handleSubmit,
    onSubmit,
    loading,
    error,
    success,
    isSubmitting,
    availableData,
    currentModel,
    selectedModel,
    filteredModels,
    isProviderDisabled,
    isModelDisabled
  } = useAIModelSelector(open, onClose);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      slotProps={{
        paper: {
          sx: {
            ...(isMobile
              ? {
                  margin: 0,
                  maxHeight: '100vh',
                  height: '100vh',
                  borderRadius: 0,
                  display: 'flex',
                  flexDirection: 'column'
                }
              : {
                  maxHeight: '90vh'
                })
          }
        }
      }}
    >
      <DialogTitle
        sx={{
          pb: isMobile ? 1 : 2,
          px: isMobile ? 2 : 3,
          fontSize: isMobile ? '1.1rem' : '1.25rem',
          flexShrink: 0
        }}
      >
        Выбор AI модели
      </DialogTitle>

      <DialogContent
        sx={{
          px: isMobile ? 2 : 3,
          pt: isMobile ? 1 : 2,
          pb: isMobile ? 2 : 2,
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={isMobile ? 32 : 40} />
          </Box>
        ) : (
          <>
            {!availableData.hasTokens ? (
              <Alert severity="warning" sx={{ mb: 2, fontSize: isMobile ? '0.875rem' : '1rem' }}>
                У вас нет добавленных токенов. Пожалуйста, добавьте токен в настройках, чтобы
                использовать AI модели.
              </Alert>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)}>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{
                    fontSize: isMobile ? '0.875rem' : '0.875rem',
                    marginBottom: '16px'
                  }}
                >
                  Выберите AI модель для генерации текста. Доступны только модели, для которых
                  добавлен токен.
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 2, fontSize: isMobile ? '0.875rem' : '1rem' }}>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert
                    severity="success"
                    sx={{ mb: 2, fontSize: isMobile ? '0.875rem' : '1rem' }}
                  >
                    {success}
                  </Alert>
                )}

                <Controller
                  name="provider"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth margin="normal" size={isMobile ? 'small' : 'medium'}>
                      <InputLabel>Провайдер</InputLabel>
                      <Select
                        {...field}
                        disabled={isProviderDisabled || isSubmitting}
                        label="Провайдер"
                        sx={{
                          '& .MuiSelect-select': {
                            fontSize: isMobile ? '0.875rem' : '1rem'
                          }
                        }}
                      >
                        {availableData.providers.map(provider => (
                          <MenuItem
                            key={provider}
                            value={provider}
                            sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                          >
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
                    <FormControl fullWidth margin="normal" size={isMobile ? 'small' : 'medium'}>
                      <InputLabel>Модель</InputLabel>
                      <Select
                        {...field}
                        disabled={isModelDisabled || isSubmitting}
                        label="Модель"
                        sx={{
                          '& .MuiSelect-select': {
                            fontSize: isMobile ? '0.875rem' : '1rem'
                          }
                        }}
                      >
                        {filteredModels.map(model => (
                          <MenuItem
                            key={model.value}
                            value={model.value}
                            sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                          >
                            {model.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />

                {currentModel && (
                  <Box
                    sx={{
                      mt: 2,
                      p: isMobile ? 1.5 : 2,
                      bgcolor: 'background.default',
                      borderRadius: 1
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ fontSize: isMobile ? '0.75rem' : '0.75rem' }}
                    >
                      Текущая модель:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: isMobile ? '0.875rem' : '0.875rem' }}
                    >
                      {availableData.models.find(m => m.value === currentModel)?.label ||
                        currentModel}
                    </Typography>
                  </Box>
                )}
              </form>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: isMobile ? 2 : 3, pb: isMobile ? 2 : 2, flexShrink: 0 }}>
        <Button onClick={onClose} disabled={isSubmitting} size={isMobile ? 'small' : 'medium'}>
          Отмена
        </Button>
        {availableData.hasTokens && (
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={loading || isSubmitting || !selectedModel || selectedModel === currentModel}
            size={isMobile ? 'small' : 'medium'}
            startIcon={isSubmitting ? <CircularProgress size={isMobile ? 16 : 20} /> : null}
          >
            {isSubmitting ? 'Сохранение...' : 'Сохранить'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AIModelSelector;
