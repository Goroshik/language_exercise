'use client';

import BookIcon from '@mui/icons-material/Book';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TopicIcon from '@mui/icons-material/Topic';
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useAppStore } from 'src/store/appStore';
import { useSettingsStore } from 'src/store/settingsStore';
import AIModelSelector from './AIModelSelector';
import LanguageSelector from './LanguageSelector';
import SettingsModal from './SettingsModal';

const Header: React.FC = () => {
  const route = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiModelOpen, setAiModelOpen] = useState(false);
  const { selectedTopic, loadLastSelectedTopic, state, isNavigating, setIsNavigating } =
    useAppStore();
  const { loadSettings, settings } = useSettingsStore();

  const isLoading = state === 'loading-exercises' || state === 'loading-topics' || isNavigating;

  // Get display name for the learning language
  const getLanguageDisplayName = () => {
    const languageCode = settings?.learningLanguage || 'en';
    const languageNames: Record<string, string> = {
      en: 'английского',
      pl: 'польского',
      de: 'немецкого',
      fr: 'французского',
      es: 'испанского',
      it: 'итальянского'
    };
    return languageNames[languageCode] || languageCode;
  };

  useEffect(() => {
    loadLastSelectedTopic();
    loadSettings();
  }, [loadLastSelectedTopic, loadSettings]);

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
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontSize: { xs: '0.95rem', sm: '1.25rem' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: isMobile ? 'nowrap' : 'normal'
            }}
          >
            {isMobile ? (
              // Mobile: Show only language name or shortened version
              `${getLanguageDisplayName()}`
            ) : (
              // Desktop/Tablet: Full title
              <>
                Изучение {getLanguageDisplayName()} языка
                {selectedTopic && !isTablet && (
                  <Typography component="span" variant="subtitle1" sx={{ ml: 2, opacity: 0.9 }}>
                    - {selectedTopic}
                  </Typography>
                )}
              </>
            )}
          </Typography>
          <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, alignItems: 'center' }}>
            {!isMobile && <LanguageSelector />}
            <Tooltip title="Темы">
              <span>
                <IconButton
                  color="inherit"
                  onClick={() => handleNavigation('/topics')}
                  disabled={isLoading}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    backgroundColor: 'white',
                    color: 'primary.main',
                    '&:hover': { backgroundColor: '#f5f5f5' },
                    '&.Mui-disabled': { backgroundColor: '#e0e0e0', color: '#9e9e9e' }
                  }}
                  aria-label="topics"
                >
                  <TopicIcon fontSize={isMobile ? 'small' : 'medium'} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Словарь">
              <span>
                <IconButton
                  color="inherit"
                  onClick={() => handleNavigation('/dictionary')}
                  disabled={isLoading}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    backgroundColor: 'white',
                    color: 'primary.main',
                    '&:hover': { backgroundColor: '#f5f5f5' },
                    '&.Mui-disabled': { backgroundColor: '#e0e0e0', color: '#9e9e9e' }
                  }}
                  aria-label="dictionary"
                >
                  <BookIcon fontSize={isMobile ? 'small' : 'medium'} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="История">
              <span>
                <IconButton
                  color="inherit"
                  onClick={() => handleNavigation('/exercises/generated-history')}
                  disabled={isLoading}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    backgroundColor: 'white',
                    color: 'primary.main',
                    '&:hover': { backgroundColor: '#f5f5f5' },
                    '&.Mui-disabled': { backgroundColor: '#e0e0e0', color: '#9e9e9e' }
                  }}
                  aria-label="history"
                >
                  <HistoryIcon fontSize={isMobile ? 'small' : 'medium'} />
                </IconButton>
              </span>
            </Tooltip>
            {!isMobile && (
              <Tooltip title="AI модель">
                <span>
                  <IconButton
                    color="inherit"
                    onClick={handleAiModelOpen}
                    disabled={isLoading}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{
                      backgroundColor: 'white',
                      color: 'primary.main',
                      '&:hover': { backgroundColor: '#f5f5f5' },
                      '&.Mui-disabled': { backgroundColor: '#e0e0e0', color: '#9e9e9e' }
                    }}
                    aria-label="ai-model"
                  >
                    <SmartToyIcon fontSize={isMobile ? 'small' : 'medium'} />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            <Tooltip title="Настройки">
              <span>
                <IconButton
                  color="inherit"
                  onClick={handleSettingsOpen}
                  disabled={isLoading}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    backgroundColor: 'white',
                    color: 'primary.main',
                    '&:hover': { backgroundColor: '#f5f5f5' },
                    '&.Mui-disabled': { backgroundColor: '#e0e0e0', color: '#9e9e9e' }
                  }}
                  aria-label="settings"
                >
                  <SettingsIcon fontSize={isMobile ? 'small' : 'medium'} />
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
