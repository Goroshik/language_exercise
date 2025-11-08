'use client';

import BugReportIcon from '@mui/icons-material/BugReport';
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
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  useMediaQuery,
  useTheme
} from '@mui/material';
import React, { useState } from 'react';
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

  const handleClose = () => {
    if (!loading) {
      // Reset form
      setIssueType('bug');
      setTitle('');
      setDescription('');
      onClose();
    }
  };

  const handleIssueTypeChange = (event: SelectChangeEvent<IssueType>) => {
    setIssueType(event.target.value as IssueType);
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
          description: description.trim()
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
