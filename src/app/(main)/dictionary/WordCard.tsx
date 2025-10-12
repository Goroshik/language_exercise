import React, {useState} from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
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
import {DictionaryWord} from 'src/types';

interface WordCardProps {
  word: DictionaryWord;
  onWordUpdate?: () => void;
  onWordDelete?: () => void;
}

const WordCard: React.FC<WordCardProps> = ({word, onWordUpdate, onWordDelete}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editWord, setEditWord] = useState(word.word);
  const [editTranslate, setEditTranslate] = useState(word.translate);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateWord = async (id: string, word: string, translate: string) => {
    const response = await fetch(`/api/dictionary/words/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({word, translate}),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to update word');
    }
    return data.word;
  };

  const removeWord = async (id: string) => {
    const response = await fetch(`/api/dictionary/words/${id}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to remove word');
    }
  };

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
    // NOTE: Check if window is available (client-side only)
    if (typeof window !== 'undefined' && window.confirm('Вы уверены, что хотите удалить это слово?')) {
      setIsDeleting(true);
      try {
        await removeWord(word.id);
        onWordDelete?.();
      } catch (error) {
        console.error('Failed to delete word:', error);
        // NOTE: Check if alert is available (client-side only)
        if (typeof window !== 'undefined') {
          alert('Не удалось удалить слово. Попробуйте еще раз.');
        }
      } finally {
        setIsDeleting(false);
      }
    }
    handleMenuClose();
  };

  const handleSaveEdit = async () => {
    if (editWord.trim() && editTranslate.trim()) {
      setIsUpdating(true);
      try {
        await updateWord(word.id, editWord, editTranslate);
        setEditDialogOpen(false);
        onWordUpdate?.();
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
    setEditDialogOpen(false);
  };

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

              <Typography variant="caption" color="text.secondary" sx={{mt: 1, display: 'block'}}>
                {new Date(word.createdAt).toLocaleDateString('ru-RU')}
              </Typography>
            </Box>


            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{ml: 1}}
            >
              <MoreVertIcon/>
            </IconButton>
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

