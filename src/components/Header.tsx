'use client';

import React, { useState, useEffect } from 'react';
import { AppBar, Box, Toolbar, Typography, IconButton, Tooltip } from '@mui/material';
import { useRouter } from 'next/navigation';
import SettingsIcon from '@mui/icons-material/Settings';
import TopicIcon from '@mui/icons-material/Topic';
import BookIcon from '@mui/icons-material/Book';
import HistoryIcon from '@mui/icons-material/History';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SettingsModal from './SettingsModal';
import AIModelSelector from './AIModelSelector';
import { useAppStore } from 'src/store/appStore';

const Header: React.FC = () => {
  const route = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiModelOpen, setAiModelOpen] = useState(false);
  const { selectedTopic, lastSelectedTopicPath, loadLastSelectedTopic } = useAppStore();

  useEffect(() => {
    loadLastSelectedTopic();
  }, [loadLastSelectedTopic]);

  const handleSettingsOpen = () => {
    setSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  const handleAiModelOpen = () => {
    setAiModelOpen(true);
  };

  const handleAiModelClose = () => {
    setAiModelOpen(false);
  };

  const handleTopicsClick = () => {
    if (lastSelectedTopicPath) {
      route.push(`/exercises/${lastSelectedTopicPath}`);
    } else {
      route.push('/topics');
    }
  };

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Изучение английского языка
            {selectedTopic && (
              <Typography component="span" variant="subtitle1" sx={{ ml: 2, opacity: 0.9 }}>
                - {selectedTopic}
              </Typography>
            )}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Темы">
              <IconButton
                color="inherit"
                onClick={handleTopicsClick}
                sx={{
                  backgroundColor: 'white',
                  color: 'primary.main',
                  '&:hover': { backgroundColor: '#f5f5f5' }
                }}
                aria-label="topics"
              >
                <TopicIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Словарь">
              <IconButton
                color="inherit"
                onClick={() => route.push('/dictionary')}
                sx={{
                  backgroundColor: 'white',
                  color: 'primary.main',
                  '&:hover': { backgroundColor: '#f5f5f5' }
                }}
                aria-label="dictionary"
              >
                <BookIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="История">
              <IconButton
                color="inherit"
                onClick={() => route.push('/exercises/generated-history')}
                sx={{
                  backgroundColor: 'white',
                  color: 'primary.main',
                  '&:hover': { backgroundColor: '#f5f5f5' }
                }}
                aria-label="history"
              >
                <HistoryIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="AI модель">
              <IconButton
                color="inherit"
                onClick={handleAiModelOpen}
                sx={{
                  backgroundColor: 'white',
                  color: 'primary.main',
                  '&:hover': { backgroundColor: '#f5f5f5' }
                }}
                aria-label="ai-model"
              >
                <SmartToyIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Настройки">
              <IconButton
                color="inherit"
                onClick={handleSettingsOpen}
                sx={{
                  backgroundColor: 'white',
                  color: 'primary.main',
                  '&:hover': { backgroundColor: '#f5f5f5' }
                }}
                aria-label="settings"
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <SettingsModal open={settingsOpen} onClose={handleSettingsClose} />

      <AIModelSelector open={aiModelOpen} onClose={handleAiModelClose} />
    </>
  );
};

export default Header;
