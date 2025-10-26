import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { Box, Button, CircularProgress, IconButton, Paper, Typography } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import ImportWordsModal from './ImportWordsModal';

interface WordTranslationPanelProps {
  word: string;
  position: { x: number; y: number };
  onClose: () => void;
}

const WordTranslationPanel: React.FC<WordTranslationPanelProps> = ({ word, position, onClose }) => {
  const [translation, setTranslation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wordExists, setWordExists] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // NOTE: Handle clicks outside the panel to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Add event listener with a small delay to prevent immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // NOTE: Get word translation when component mounts
  useEffect(() => {
    let isSubscribed = true; // Prevent state updates on unmounted component

    const getTranslation = async (word: string) => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word })
        });
        const data = await response.json();

        if (!isSubscribed) return; // Don't update state if component unmounted

        if (data.text) {
          setTranslation(data.text.trim() || 'Перевод не найден');
          setWordExists(data.exists === true);
        } else {
          setTranslation(data.error || 'Ошибка при переводе');
          setWordExists(false);
        }
      } catch {
        if (isSubscribed) {
          setTranslation('Ошибка при переводе');
          setWordExists(false);
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    getTranslation(word);

    return () => {
      isSubscribed = false; // Cleanup: prevent state updates after unmount
    };
  }, [word]);

  const handleAddToDictionary = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    onClose(); // Close the translation panel after modal closes
  };

  // NOTE: Prevent modal backdrop clicks from propagating to parent components
  const handlePanelClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <>
      <Paper
        ref={panelRef}
        elevation={8}
        onClick={handlePanelClick}
        sx={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 9999,
          p: 2,
          minWidth: 200,
          maxWidth: 300,
          backgroundColor: '#fff',
          border: '1px solid #e0e0e0'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
            {word}
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ mb: 2 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                Переводится...
              </Typography>
            </Box>
          ) : (
            <>
              <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                {translation}
              </Typography>
              {wordExists && (
                <Typography
                  variant="caption"
                  sx={{ color: 'success.main', mt: 0.5, display: 'block' }}
                >
                  ✓ Слово уже в словаре
                </Typography>
              )}
            </>
          )}
        </Box>

        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddToDictionary}
          disabled={
            isLoading || !translation || translation === 'Ошибка при переводе' || wordExists
          }
          fullWidth
          sx={{ textTransform: 'none' }}
        >
          {wordExists ? 'Уже в словаре' : 'Добавить в словарь'}
        </Button>
      </Paper>

      <ImportWordsModal
        open={isModalOpen}
        onClose={handleCloseModal}
        preFilledWord={word}
        preFilledTranslate={translation}
      />
    </>
  );
};

export default WordTranslationPanel;
