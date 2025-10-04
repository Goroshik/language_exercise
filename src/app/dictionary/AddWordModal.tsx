import React, {useState, useEffect} from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import {Controller, useForm} from 'react-hook-form';

interface AddWordForm {
  word: string;
  translate: string;
  tags: string[];
}

interface AddWordModalProps {
  open: boolean;
  onClose: () => void;
}

const AddWordModal: React.FC<AddWordModalProps> = ({open, onClose}) => {
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  const {
    control,
    handleSubmit,
    reset,
    formState: {errors},
    setValue,
  } = useForm<AddWordForm>({
    defaultValues: {
      word: '',
      translate: '',
      tags: [],
    },
  });

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
        setAllTags(data.tags);
      }
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const addWord = async (word: string, translate: string, tags: string[]) => {
    const response = await fetch('/api/dictionary/words', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ word, translate, tags }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to add word');
    }

    // Update allTags if new tags were added
    if (data.allTags) {
      setAllTags(data.allTags);
    }

    return data.word;
  };

  const onSubmit = async (data: AddWordForm) => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      await addWord(data.word, data.translate, selectedTags);
      reset();
      setSelectedTags([]);
      setTagInput('');
      onClose();
    } catch (error) {
      setSubmitError('Не удалось добавить слово. Попробуйте еще раз.');
      console.error('Failed to add word:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedTags([]);
    setTagInput('');
    onClose();
  };

  const handleTagSelection = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      setValue('tags', [...selectedTags, tag]);
    }
    setTagInput('');
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
      const newTag = tagInput.trim();
      setSelectedTags([...selectedTags, newTag]);
      setValue('tags', [...selectedTags, newTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(newTags);
    setValue('tags', newTags);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Добавить новое слово</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            <Controller
              name="word"
              control={control}
              rules={{
                required: 'Слово обязательно для заполнения',
                minLength: {
                  value: 1,
                  message: 'Слово не может быть пустым',
                },
              }}
              render={({field}) => (
                <TextField
                  {...field}
                  label="Слово"
                  variant="outlined"
                  fullWidth
                  error={!!errors.word}
                  helperText={errors.word?.message}
                />
              )}
            />

            <Controller
              name="translate"
              control={control}
              rules={{
                required: 'Перевод обязателен для заполнения',
                minLength: {
                  value: 1,
                  message: 'Перевод не может быть пустым',
                },
              }}
              render={({field}) => (
                <TextField
                  {...field}
                  label="Перевод"
                  variant="outlined"
                  fullWidth
                  error={!!errors.translate}
                  helperText={errors.translate?.message}
                />
              )}
            />

            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Теги
              </Typography>

              {/* Показать выбранные теги */}
              {selectedTags.length > 0 && (
                <Box mb={2} display="flex" gap={1} flexWrap="wrap">
                  {selectedTags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      variant="filled"
                      color="primary"
                    />
                  ))}
                </Box>
              )}

              {/* Поле ввода для тегов */}
              <Box display="flex" gap={1} mb={1}>
                <TextField
                  fullWidth
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Введите новый тег"
                  variant="outlined"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                >
                  Добавить тег
                </Button>
              </Box>

              {/* Существующие теги для выбора */}
              {allTags.length > 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Или выберите существующий тег:
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {allTags
                      .filter(tag => !selectedTags.includes(tag))
                      .map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          onClick={() => handleTagSelection(tag)}
                          variant="outlined"
                          clickable
                        />
                      ))}
                  </Box>
                </Box>
              )}

              {/* Ошибка валидации */}
              {selectedTags.length === 0 && (
                <Typography variant="caption" color="error" sx={{mt: 1, display: 'block'}}>
                  Выберите хотя бы один тег
                </Typography>
              )}
            </Box>
          </Box>

          {/* Error message */}
          {submitError && (
            <Alert severity="error" sx={{mt: 2}}>
              {submitError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary" disabled={isSubmitting}>
            Отмена
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={selectedTags.length === 0 || isSubmitting}
          >
            {isSubmitting ? 'Добавление...' : 'Добавить'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddWordModal;
