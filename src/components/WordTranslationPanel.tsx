import React, {useEffect, useState} from 'react';
import {Box, Button, CircularProgress, IconButton, Paper, Typography,} from '@mui/material';
import {Add as AddIcon, Close as CloseIcon} from '@mui/icons-material';
import ImportWordsModal from './ImportWordsModal';

interface WordTranslationPanelProps {
  word: string;
  position: { x: number; y: number };
  onClose: () => void;
}

const WordTranslationPanel: React.FC<WordTranslationPanelProps> = ({
                                                                     word,
                                                                     position,
                                                                     onClose,
                                                                   }) => {
  const [translation, setTranslation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // NOTE: Get word translation when component mounts
  useEffect(() => {
    const getTranslation = async (word: string) => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({word})
        });
        const data = await response.json();
        if (data.text) {
          setTranslation(data.text.trim() || 'Перевод не найден');
        } else {
          setTranslation(data.error || 'Ошибка при переводе');
        }
      } catch (error) {
        setTranslation('Ошибка при переводе');
      } finally {
        setIsLoading(false);
      }
    };

    getTranslation(word);
  }, [word]);

  const handleAddToDictionary = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // NOTE: Prevent modal backdrop clicks from propagating to parent components
  const handlePanelClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <>
      <Paper
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
          border: '1px solid #e0e0e0',
        }}
      >
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
          <Typography variant="h6" sx={{fontWeight: 600, color: 'primary.main'}}>
            {word}
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small"/>
          </IconButton>
        </Box>

        <Box sx={{mb: 2}}>
          {isLoading ? (
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
              <CircularProgress size={16}/>
              <Typography variant="body2" color="text.secondary">
                Переводится...
              </Typography>
            </Box>
          ) : (
            <Typography variant="body1" sx={{fontStyle: 'italic'}}>
              {translation}
            </Typography>
          )}
        </Box>

        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon/>}
          onClick={handleAddToDictionary}
          disabled={isLoading || !translation || translation === 'Ошибка при переводе'}
          fullWidth
          sx={{textTransform: 'none'}}
        >
          Добавить в словарь
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
