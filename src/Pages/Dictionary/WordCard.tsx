import React, {useState} from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Typography
} from '@mui/material';
import {Delete as DeleteIcon, Edit as EditIcon, MoreVert as MoreVertIcon} from '@mui/icons-material';
import {DictionaryWord} from '../../types';
import {useDictionaryStore} from '../../store/dictionaryStore';

interface WordCardProps {
  word: DictionaryWord;
}

const WordCard: React.FC<WordCardProps> = ({word}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editWord, setEditWord] = useState(word.word);
  const [editTranslate, setEditTranslate] = useState(word.translate);
  const [editTags, setEditTags] = useState(word.tags);
  const [tagInput, setTagInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const {updateWord, removeWord} = useDictionaryStore();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteClick = async () => {
    if (window.confirm('Вы уверены, что хотите удалить это слово?')) {
      setIsDeleting(true);
      try {
        await removeWord(word.id);
      } catch (error) {
        console.error('Failed to delete word:', error);
        alert('Не удалось удалить слово. Попробуйте еще раз.');
      } finally {
        setIsDeleting(false);
      }
    }
    handleMenuClose();
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !editTags.includes(trimmedTag)) {
      setEditTags([...editTags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(tag => tag !== tagToRemove));
  };

  const handleSaveEdit = async () => {
    if (editWord.trim() && editTranslate.trim() && editTags.length > 0) {
      setIsUpdating(true);
      try {
        await updateWord(word.id, editWord, editTranslate, editTags);
        setEditDialogOpen(false);
      } catch (error) {
        console.error('Failed to update word:', error);
        alert('Не удалось обновить слово. Попробуйте еще раз.');
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditWord(word.word);
    setEditTranslate(word.translate);
    setEditTags(word.tags);
    setEditDialogOpen(false);
  };

  const canEdit = word.isUserAdded;

  return (
    <>
      <Card sx={{mb: 2, position: 'relative'}}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box flexGrow={1}>
              <Typography variant="h6" component="h3" gutterBottom>
                {word.word}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {word.translate}
              </Typography>

              <Box display="flex" gap={1} flexWrap="wrap">
                {word.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{mt: 1, display: 'block'}}>
                {word.isUserAdded ? 'Добавлено пользователем' : 'Из словаря'}
                {' • '}
                {new Date(word.createdAt).toLocaleDateString('ru-RU')}
              </Typography>
            </Box>

            {canEdit && (
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                sx={{ml: 1}}
              >
                <MoreVertIcon/>
              </IconButton>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Контекстное меню */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditClick} disabled={isDeleting || isUpdating}>
          <EditIcon sx={{mr: 1}} fontSize="small"/>
          Редактировать
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{color: 'error.main'}} disabled={isDeleting || isUpdating}>
          <DeleteIcon sx={{mr: 1}} fontSize="small"/>
          {isDeleting ? 'Удаление...' : 'Удалить'}
        </MenuItem>
      </Menu>

      {/* Диалог редактирования */}
      <Dialog open={editDialogOpen} onClose={handleCancelEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Редактировать слово</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Слово на английском"
            value={editWord}
            onChange={(e) => setEditWord(e.target.value)}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Перевод"
            value={editTranslate}
            onChange={(e) => setEditTranslate(e.target.value)}
            margin="normal"
            required
          />

          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Теги:
            </Typography>

            <Box display="flex" gap={1} mb={1} flexWrap="wrap">
              {editTags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>

            <Box display="flex" gap={1}>
              <TextField
                size="small"
                placeholder="Введите тег"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                sx={{flexGrow: 1}}
              />
              <Button
                variant="outlined"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
              >
                Добавить
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit} disabled={isUpdating}>Отмена</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={isUpdating}>
            {isUpdating ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default WordCard;

