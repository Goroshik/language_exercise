'use client';

import React, { useState, useEffect } from 'react';
import { Select, MenuItem, FormControl, SelectChangeEvent, Box } from '@mui/material';
import { showAlert } from 'src/utils/alert';

interface LanguageSelectorProps {
  onChange?: (language: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onChange }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadCurrentLanguage();
  }, []);

  const loadCurrentLanguage = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const settings = await response.json();
        setSelectedLanguage(settings.learningLanguage || 'en');
      }
    } catch (error) {
      console.error('Failed to load language setting:', error);
    }
  };

  const handleLanguageChange = async (event: SelectChangeEvent<string>) => {
    const newLanguage = event.target.value;
    setLoading(true);

    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ learningLanguage: newLanguage })
      });

      if (response.ok) {
        setSelectedLanguage(newLanguage);
        showAlert.success('Язык изучения изменён');
        if (onChange) {
          onChange(newLanguage);
        }
      } else {
        showAlert.error('Не удалось изменить язык');
      }
    } catch (error) {
      showAlert.error('Ошибка при изменении языка');
      console.error('Error changing language:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth size="small">
        <Select
          value={selectedLanguage}
          onChange={handleLanguageChange}
          disabled={loading}
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
