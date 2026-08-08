import { Box, Button, CircularProgress, TextField, Typography } from '@mui/material';
import React from 'react';

interface EssayInputProps {
  content: string;
  wordCount: number;
  charCount: number;
  saving: boolean;
  loading: boolean;
  onContentChange: (content: string) => void;
  onCheck: () => void;
}

const EssayInputComponent: React.FC<EssayInputProps> = ({
  content,
  wordCount,
  charCount,
  saving,
  loading,
  onContentChange,
  onCheck
}) => {
  return (
    <Box sx={{ flex: 1 }}>
      <TextField
        multiline
        rows={20}
        fullWidth
        value={content}
        onChange={e => onContentChange(e.target.value)}
        placeholder="Введите ваш текст здесь..."
        sx={{ mb: 1 }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary'
          }}
        >
          Слов: {wordCount} | Символов: {charCount}
          {saving && <> • Сохранение...</>}
        </Typography>
        <Button
          variant="contained"
          onClick={onCheck}
          disabled={loading || !content.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Проверяем...' : 'Проверить'}
        </Button>
      </Box>
    </Box>
  );
};

// Memoize component to prevent unnecessary re-renders
export const EssayInput = React.memo(EssayInputComponent);
