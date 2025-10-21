'use client';

import React, { useState } from 'react';
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
  const { state, isNavigating, setIsNavigating } = useAppStore();

  const isLoading = state === 'loading-exercises' || state === 'loading-topics' || isNavigating;

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

  const handleNavigation = (path: string) => {
    if (isLoading) return;
    setIsNavigating(true);
    route.push(path);
  };

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Изучение английского языка
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Темы">
              <span>
                <IconButton
                  color="inherit"
                  onClick={() => handleNavigation('/topics')}
                  disabled={isLoading}
                  sx={{
                    backgroundColor: 'white',
                    color: 'primary.main',
                    '&:hover': { backgroundColor: '#f5f5f5' },
                    '&.Mui-disabled': { backgroundColor: '#e0e0e0', color: '#9e9e9e' }
                  }}
                  aria-label="topics"
                >
                  <TopicIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Словарь">
              <span>
                <IconButton
                  color="inherit"
                  onClick={() => handleNavigation('/dictionary')}
                  disabled={isLoading}
                  sx={{
                    backgroundColor: 'white',
                    color: 'primary.main',
                    '&:hover': { backgroundColor: '#f5f5f5' },
                    '&.Mui-disabled': { backgroundColor: '#e0e0e0', color: '#9e9e9e' }
                  }}
                  aria-label="dictionary"
                >
                  <BookIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="История">
              <span>
                <IconButton
                  color="inherit"
                  onClick={() => handleNavigation('/exercises/generated-history')}
                  disabled={isLoading}
                  sx={{
                    backgroundColor: 'white',
                    color: 'primary.main',
                    '&:hover': { backgroundColor: '#f5f5f5' },
                    '&.Mui-disabled': { backgroundColor: '#e0e0e0', color: '#9e9e9e' }
                  }}
                  aria-label="history"
                >
                  <HistoryIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="AI модель">
              <span>
                <IconButton
                  color="inherit"
                  onClick={handleAiModelOpen}
                  disabled={isLoading}
                  sx={{
                    backgroundColor: 'white',
                    color: 'primary.main',
                    '&:hover': { backgroundColor: '#f5f5f5' },
                    '&.Mui-disabled': { backgroundColor: '#e0e0e0', color: '#9e9e9e' }
                  }}
                  aria-label="ai-model"
                >
                  <SmartToyIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Настройки">
              <span>
                <IconButton
                  color="inherit"
                  onClick={handleSettingsOpen}
                  disabled={isLoading}
                  sx={{
                    backgroundColor: 'white',
                    color: 'primary.main',
                    '&:hover': { backgroundColor: '#f5f5f5' },
                    '&.Mui-disabled': { backgroundColor: '#e0e0e0', color: '#9e9e9e' }
                  }}
                  aria-label="settings"
                >
                  <SettingsIcon />
                </IconButton>
              </span>
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
