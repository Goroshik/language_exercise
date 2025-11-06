import ClearIcon from '@mui/icons-material/Clear';
import { Autocomplete, Box, IconButton, TextField, Tooltip, Typography } from '@mui/material';
import React from 'react';

interface EssayHeaderProps {
  languageCode: string;
  title: string;
  allTopics: string[];
  onTitleChange: (title: string | null) => void;
  onClear: () => void;
}

export const EssayHeader: React.FC<EssayHeaderProps> = ({
  languageCode,
  title,
  allTopics,
  onTitleChange,
  onClear
}) => {
  return (
    <>
      <Typography variant="h4" gutterBottom>
        Написание текстов на {languageCode === 'en' ? 'английском' : 'польском'} языке
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        💾 Введенный текст сохраняется автоматически и будет доступен с любого устройства
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Autocomplete
          freeSolo
          options={allTopics}
          value={title}
          onChange={(_, newValue) => onTitleChange(newValue)}
          onInputChange={(_, newValue) => onTitleChange(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Тема"
              placeholder="Выберите или введите тему"
            />
          )}
          sx={{ flex: 1 }}
        />
        <Tooltip title="Очистить поля для выбранной темы (старые данные будут перезаписаны при сохранении)">
          <IconButton onClick={onClear} color="primary">
            <ClearIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </>
  );
};
