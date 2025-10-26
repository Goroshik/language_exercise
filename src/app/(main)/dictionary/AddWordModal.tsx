'use client';

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { showAlert } from 'src/utils/alert';

interface AddWordModalProps {
  open: boolean;
  onClose: () => void;
  onWordAdded?: () => void;
  defaultWord?: string;
  defaultTranslate?: string;
}

interface FormData {
  word: string;
  translate: string;
}

const AddWordModal: React.FC<AddWordModalProps> = ({
  open,
  onClose,
  onWordAdded,
  defaultWord,
  defaultTranslate
}) => {
  const [error, setError] = useState('');

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors }
  } = useForm<FormData>({
    defaultValues: {
      word: '',
      translate: ''
    }
  });

  useEffect(() => {
    if (open) {
      reset({
        word: defaultWord ?? '',
        translate: defaultTranslate ?? ''
      });
      setError('');
    }
  }, [open, defaultWord, defaultTranslate, reset]);

  const handleClose = () => {
    reset();
    setError('');
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    setError('');

    try {
      const response = await fetch('/api/dictionary/words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          words: [
            {
              word: data.word.trim(),
              translate: data.translate.trim()
            }
          ]
        })
      });

      const result = await response.json();

      if (result.success) {
        if (onWordAdded) {
          onWordAdded();
        }
        handleClose();
      } else {
        setError(result.error || 'Не удалось добавить слово. Попробуйте еще раз');
      }
    } catch (error) {
      console.error('Failed to add word', error);
      showAlert.error('Failed to add word');
      setError('Не удалось добавить слово. Попробуйте еще раз');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Добавить новое слово</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Controller
              name="word"
              control={control}
              rules={{
                required: 'Введите слово',
                validate: value => value.trim() !== '' || 'Введите слово'
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Слово"
                  fullWidth
                  autoFocus
                  placeholder="Введите слово"
                  error={!!errors.word}
                  helperText={errors.word?.message}
                  disabled={isSubmitting}
                />
              )}
            />

            <Controller
              name="translate"
              control={control}
              rules={{
                required: 'Введите перевод',
                validate: value => value.trim() !== '' || 'Введите перевод'
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Перевод"
                  fullWidth
                  placeholder="Введите перевод"
                  error={!!errors.translate}
                  helperText={errors.translate?.message}
                  disabled={isSubmitting}
                />
              )}
            />

            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Добавление...' : 'Добавить'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddWordModal;
