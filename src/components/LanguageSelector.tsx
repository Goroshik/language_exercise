'use client';

import { Box, FormControl, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import React, { useEffect } from 'react';
import { useSettingsStore } from 'src/store/settingsStore';
import { showAlert } from 'src/utils/alert';

interface LanguageSelectorProps {
  onChange?: (language: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onChange }) => {
  const { settings, isLoading, loadSettings, updateLearningLanguage } = useSettingsStore();

  useEffect(() => {
    if (!settings) {
      loadSettings();
    }
  }, [settings, loadSettings]);

  const handleLanguageChange = async (event: SelectChangeEvent<string>) => {
    const newLanguage = event.target.value;

    try {
      await updateLearningLanguage(newLanguage);
      showAlert.success('Язык изучения изменён');
      if (onChange) {
        onChange(newLanguage);
      }
    } catch (_error) {
      showAlert.error('Ошибка при изменении языка');
    }
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth size="small">
        <Select
          value={settings?.learningLanguage || 'en'}
          onChange={handleLanguageChange}
          disabled={isLoading}
          sx={{
            backgroundColor: 'white',
            color: 'primary.main',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'white'
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'white'
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'white'
            }
          }}
        >
          <MenuItem value="en">English</MenuItem>
          <MenuItem value="pl">Polski</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default LanguageSelector;
