'use client';

import AttachFileIcon from '@mui/icons-material/AttachFile';
import BugReportIcon from '@mui/icons-material/BugReport';
import CloseIcon from '@mui/icons-material/Close';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import React, { useRef, useState } from 'react';
import { showAlert } from 'src/utils/alert';

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

type IssueType = 'bug' | 'feature';

const FeedbackModal: React.FC<FeedbackModalProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(false);
  const [issueType, setIssueType] = useState<IssueType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    if (!loading) {
      // Reset form
      setIssueType('bug');
      setTitle('');
      setDescription('');
      setImage(null);
      setImagePreview(null);
      onClose();
    }
  };

  const handleIssueTypeChange = (event: SelectChangeEvent<IssueType>) => {
    setIssueType(event.target.value as IssueType);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      showAlert.error('Пожалуйста, выберите файл изображения');
      return;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      showAlert.error('Размер изображения не должен превышать 5MB');
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImage(result);
      setImagePreview(result);
    };
    reader.onerror = () => {
      showAlert.error('Не удалось загрузить изображение');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      showAlert.error('Пожалуйста, введите заголовок');
      return;
    }

    if (!description.trim()) {
      showAlert.error('Пожалуйста, введите описание');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: issueType,
          title: title.trim(),
          description: description.trim(),
          image: image || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      showAlert.success('Спасибо за обратную связь! Issue создан успешно.');
      handleClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showAlert.error(
        error instanceof Error ? error.message : 'Не удалось отправить обратную связь'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          ...(isMobile && {
            m: 0,
            maxHeight: '100%'
          })
        }
      }}
    >
      <DialogTitle>Сообщить о проблеме или предложить улучшение</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="issue-type-label">Тип</InputLabel>
            <Select
              labelId="issue-type-label"
              id="issue-type"
              value={issueType}
              label="Тип"
              onChange={handleIssueTypeChange}
              disabled={loading}
            >
              <MenuItem value="bug">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BugReportIcon fontSize="small" />
                  Баг
                </Box>
              </MenuItem>
              <MenuItem value="feature">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LightbulbIcon fontSize="small" />
                  Фича
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Заголовок"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            placeholder="Краткое описание проблемы или предложения"
            inputProps={{ maxLength: 200 }}
          />

          <TextField
            fullWidth
            label="Описание"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            multiline
            rows={6}
            placeholder="Подробное описание..."
          />

          {/* Image upload section */}
          <Box>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
              disabled={loading}
            />
            <Button
              variant="outlined"
              startIcon={<AttachFileIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || !!imagePreview}
              fullWidth
            >
              Прикрепить скриншот (опционально)
            </Button>
          </Box>

          {/* Image preview */}
          {imagePreview && (
            <Box
              sx={{
                position: 'relative',
                borderRadius: 1,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  width: '100%',
                  maxHeight: '300px',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
              <IconButton
                size="small"
                onClick={handleRemoveImage}
                disabled={loading}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)'
                  }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  px: 1,
                  py: 0.5,
                  borderRadius: 0.5
                }}
              >
                Скриншот будет прикреплен к issue
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Отправка...' : 'Отправить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeedbackModal;
