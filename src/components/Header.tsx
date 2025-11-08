'use client';

import BookIcon from '@mui/icons-material/Book';
import EditNoteIcon from '@mui/icons-material/EditNote';
import FeedbackIcon from '@mui/icons-material/Feedback';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import HistoryIcon from '@mui/icons-material/History';
import LanguageIcon from '@mui/icons-material/Language';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import SmartToyIcon from '@mui/icons-material/SmartToy';
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
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useAppStore } from 'src/store/appStore';
import { useSettingsStore } from 'src/store/settingsStore';
import AIModelSelector from './AIModelSelector';
import FeedbackModal from './FeedbackModal';
import LanguageSelector from './LanguageSelector';
import SettingsModal from './SettingsModal';

const Header: React.FC = () => {
  const route = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiModelOpen, setAiModelOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastTopicForLanguage, setLastTopicForLanguage] = useState<string | null>(null);
  const [previousLanguage, setPreviousLanguage] = useState<string | null>(null);
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

  // Load last topic for current learning language and redirect if on exercises page
  useEffect(() => {
    const loadTopicForLanguage = async () => {
      if (settings?.learningLanguage) {
        try {
          const response = await fetch(`/api/settings/topic?language=${settings.learningLanguage}`);
          const data = await response.json();
          const newTopic = data.topic || null;
          setLastTopicForLanguage(newTopic);
          
          // Check if language actually changed (not initial load)
          const languageChanged = previousLanguage !== null && previousLanguage !== settings.learningLanguage;
          
          if (languageChanged) {
            // If we're on an exercises page, redirect to the topic for new language
            if (pathname && pathname.startsWith('/exercises/')) {
              const currentPath = pathname.split('/').pop();
              
              // Don't redirect from history page
              if (currentPath === 'generated-history') {
                return;
              }
              
              if (newTopic) {
                const newPath = newTopic.toLowerCase().replace(/ /g, '_');
                
                // Only redirect if the topic is different
                if (currentPath !== newPath) {
                  route.push(`/exercises/${newPath}`);
                }
              } else {
                // If there's no saved topic for this language, redirect to topics page
                route.push('/topics');
              }
            }
          }
          
          // Update previous language
          setPreviousLanguage(settings.learningLanguage);
        } catch (error) {
          console.error('Failed to load topic for language:', error);
          setLastTopicForLanguage(null);
        }
      }
    };
    
    loadTopicForLanguage();
  }, [settings?.learningLanguage, pathname, route, previousLanguage]);

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

  const handleFeedbackOpen = () => {
    setFeedbackOpen(true);
  };

  const handleFeedbackClose = () => {
    setFeedbackOpen(false);
  };

  const handleNavigation = (path: string) => {
    if (isLoading) return;
    
    // Don't navigate if already on this page
    if (pathname === path) {
      return;
    }
    
    setIsNavigating(true);
    route.push(path);
  };

  // Helper to check if a path is active
  const isActivePath = (path: string | string[]) => {
    if (Array.isArray(path)) {
      return path.some(p => pathname === p);
    }
    return pathname === path;
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
                <Tooltip title="Тренировка">
                  <span>
                    <IconButton
                      color="inherit"
                      onClick={() => {
                        if (lastTopicForLanguage) {
                          handleNavigation(`/exercises/${lastTopicForLanguage.toLowerCase().replace(/ /g, '_')}`);
                        } else {
                          handleNavigation('/topics');
                        }
                      }}
                      disabled={isLoading || isActivePath(['/topics', lastTopicForLanguage ? `/exercises/${lastTopicForLanguage.toLowerCase().replace(/ /g, '_')}` : ''])}
                      size="medium"
                      sx={{
                        backgroundColor: 'white',
                        color: 'primary.main',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                        '&.Mui-disabled': { backgroundColor: '#e0e0e0', color: '#9e9e9e' }
                      }}
                      aria-label="training"
                    >
                      <FitnessCenterIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Сочинения">
                  <span>
                    <IconButton
                      color="inherit"
                      onClick={() => handleNavigation('/essay')}
                      disabled={isLoading || isActivePath('/essay')}
                      size="medium"
                      sx={{
                        backgroundColor: 'white',
                        color: 'primary.main',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                        '&.Mui-disabled': { backgroundColor: '#e0e0e0', color: '#9e9e9e' }
                      }}
                      aria-label="essay"
                    >
                      <EditNoteIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Словарь">
                  <span>
                    <IconButton
                      color="inherit"
                      onClick={() => handleNavigation('/dictionary')}
                      disabled={isLoading || isActivePath('/dictionary')}
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
                      disabled={isLoading || isActivePath('/exercises/generated-history')}
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
                <Tooltip title="Обратная связь">
                  <span>
                    <IconButton
                      color="inherit"
                      onClick={handleFeedbackOpen}
                      disabled={isLoading}
                      size="medium"
                      sx={{
                        backgroundColor: 'white',
                        color: 'primary.main',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                        '&.Mui-disabled': { backgroundColor: '#e0e0e0', color: '#9e9e9e' }
                      }}
                      aria-label="feedback"
                    >
                      <FeedbackIcon />
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

      <FeedbackModal open={feedbackOpen} onClose={handleFeedbackClose} />

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
          {/* Language Selector for Mobile */}
          <ListItem sx={{ py: 2, px: 2, flexDirection: 'column', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LanguageIcon color="primary" />
              </ListItemIcon>
              <Typography variant="body2" color="text.secondary">
                Язык изучения
              </Typography>
            </Box>
            <Box sx={{ width: '100%', pl: 5 }}>
              <LanguageSelector />
            </Box>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                if (lastTopicForLanguage) {
                  handleNavigation(`/exercises/${lastTopicForLanguage.toLowerCase().replace(/ /g, '_')}`);
                } else {
                  handleNavigation('/topics');
                }
                setMobileMenuOpen(false);
              }}
              disabled={isLoading || isActivePath(['/topics', lastTopicForLanguage ? `/exercises/${lastTopicForLanguage.toLowerCase().replace(/ /g, '_')}` : ''])}
            >
              <ListItemIcon>
                <FitnessCenterIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Тренировка" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                handleNavigation('/essay');
                setMobileMenuOpen(false);
              }}
              disabled={isLoading || isActivePath('/essay')}
            >
              <ListItemIcon>
                <EditNoteIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Сочинения" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                handleNavigation('/dictionary');
                setMobileMenuOpen(false);
              }}
              disabled={isLoading || isActivePath('/dictionary')}
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
              disabled={isLoading || isActivePath('/exercises/generated-history')}
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
                setFeedbackOpen(true);
                setMobileMenuOpen(false);
              }}
              disabled={isLoading}
            >
              <ListItemIcon>
                <FeedbackIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Обратная связь" />
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
