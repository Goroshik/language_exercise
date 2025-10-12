"use client"

import React, {useEffect, useState} from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';

interface Tag {
  id: string;
  name: string;
}

interface AddWordModalProps {
  open: boolean;
  onClose: () => void;
  onWordAdded?: () => void;
}

const AddWordModal: React.FC<AddWordModalProps> = ({open, onClose, onWordAdded}) => {
  const [word, setWord] = useState('');
  const [translate, setTranslate] = useState('');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadTags();
    }
  }, [open]);

  const loadTags = async () => {
    try {
      const response = await fetch('/api/dictionary/tags');
      const data = await response.json();

      if (data.success) {
        setAvailableTags(data.tags);
      }
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const handleClose = () => {
    setWord('');
    setTranslate('');
    setSelectedTags([]);
    setNewTagInput('');
    setError('');
    onClose();
  };

  const handleSubmit = async () => {
    // Validation
    if (!word.trim()) {
      setError('Введите слово');
      return;
    }

    if (!translate.trim()) {
      setError('Введите перевод');
      return;
    }


    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/dictionary/words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word: word.trim(),
          translate: translate.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (onWordAdded) {
          onWordAdded();
        }
        handleClose();
      } else {
        setError(data.error || 'Не удалось добавить слово. Попробуйте еще раз');
      }
    } catch (error) {
      console.error('Failed to add word:', error);
      setError('Не удалось добавить слово. Попробуйте еще раз');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Добавить новое слово</DialogTitle>
      <DialogContent>
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 1}}>
          <TextField
            label="Слово"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            fullWidth
            autoFocus
            placeholder="Введите слово"
          />

          <TextField
            label="Перевод"
            value={translate}
            onChange={(e) => setTranslate(e.target.value)}
            fullWidth
            placeholder="Введите перевод"
          />

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{px: 3, pb: 2}}>
        <Button onClick={handleClose} disabled={loading}>
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !word.trim() || !translate.trim()}
        >
          {loading ? 'Добавление...' : 'Добавить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddWordModal;
