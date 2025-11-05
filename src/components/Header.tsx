'use client';

import BookIcon from '@mui/icons-material/Book';
import HistoryIcon from '@mui/icons-material/History';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TopicIcon from '@mui/icons-material/Topic';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      <AppBar 
        position="static" 
        color="primary"
        sx={{ 
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <Toolbar 
          sx={{ 
            minHeight: { xs: 56, sm: 64 },
            px: { xs: 1, sm: 2 },
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontSize: { xs: '0.875rem', sm: '1.25rem' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              mr: { xs: 0.5, sm: 1 },
              minWidth: 0
            }}
          >
            {isMobile ? (
              // Mobile: Show only language name (capitalized)
              getLanguageDisplayName().charAt(0).toUpperCase() + getLanguageDisplayName().slice(1)
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
          <Box 
            sx={{ 
              display: 'flex', 
              gap: { xs: 0.5, sm: 1 }, 
              alignItems: 'center',
              flexShrink: 0
            }}
          >
            {!isMobile && <LanguageSelector />}
            
            {isMobile ? (
              // Mobile: Show only hamburger menu
              <Tooltip title="Меню">
                <IconButton
                  color="inherit"
                  onClick={() => setMobileMenuOpen(true)}
                  disabled={isLoading}
                  size="small"
                  sx={{
                    backgroundColor: 'white',
                    color: 'primary.main',
                    '&:hover': { backgroundColor: '#f5f5f5' },
                    '&.Mui-disabled': { backgroundColor: '#e0e0e0', color: '#9e9e9e' }
                  }}
                  aria-label="menu"
                >
                  <MenuIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              // Desktop: Show all buttons
              <>
                <Tooltip title="Темы">
                  <span>
                    <IconButton
                      color="inherit"
                      onClick={() => handleNavigation('/topics')}
                      disabled={isLoading}
                      size="medium"
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
                      size="medium"
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
                      size="medium"
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
                      size="medium"
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
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <SettingsModal open={settingsOpen} onClose={handleSettingsClose} />

      <AIModelSelector open={aiModelOpen} onClose={handleAiModelClose} />

      {/* Mobile menu drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{
          sx: { width: 250 }
        }}
      >
        <List>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                handleNavigation('/topics');
                setMobileMenuOpen(false);
              }}
              disabled={isLoading}
            >
              <ListItemIcon>
                <TopicIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Темы" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                handleNavigation('/dictionary');
                setMobileMenuOpen(false);
              }}
              disabled={isLoading}
            >
              <ListItemIcon>
                <BookIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Словарь" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                handleNavigation('/exercises/generated-history');
                setMobileMenuOpen(false);
              }}
              disabled={isLoading}
            >
              <ListItemIcon>
                <HistoryIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="История" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                setAiModelOpen(true);
                setMobileMenuOpen(false);
              }}
              disabled={isLoading}
            >
              <ListItemIcon>
                <SmartToyIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="AI модель" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                setSettingsOpen(true);
                setMobileMenuOpen(false);
              }}
              disabled={isLoading}
            >
              <ListItemIcon>
                <SettingsIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Настройки" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </>
  );
};

export default Header;
