'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography
} from '@mui/material';

import { useAppStore } from 'src/store/appStore';
import { useSettingsStore } from 'src/store/settingsStore';

const Page: React.FC = () => {
  const navigate = useRouter();
  const { setIsNavigating, setState } = useAppStore();
  const { settings, topics, loadSettings, loadTopics } = useSettingsStore();

  const handleTopicSelect = (topic: string) => {
    const path = topic
      .replace(/\s*\([^)]*\)/g, '')
      .toLowerCase()
      .replace(/\s+/g, '_');

    // Save to localStorage (client-side only)
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastSelectedTopicPath', path);
    }

    setIsNavigating(true);
    navigate.push(`/exercises/${path}`);
  };

  useEffect(() => {
    // Reset navigation state when this page loads
    setIsNavigating(false);
    if (!settings) {
      void loadSettings();
    }
  }, [settings, loadSettings, setIsNavigating]);

  useEffect(() => {
    if (settings?.learningLanguage) {
      void loadTopics(settings.learningLanguage);
      setState('topics-loaded');
    }
  }, [settings?.learningLanguage, loadTopics, setState]);

  return (
    <Box>
      <Typography
        variant="h6"
        sx={{
          fontSize: { xs: '1rem', sm: '1.25rem' },
          mb: { xs: 1, sm: 2 }
        }}
      >
        {settings?.learningLanguage === 'pl'
          ? 'Wybierz temat gramatyki polskiej do nauki:'
          : 'Выберите тему английской грамматики для изучения:'}
      </Typography>
      <Stack
        direction="column"
        sx={{
          alignItems: 'center'
        }}
      >
        <List
          sx={{
            width: { xs: '100%', sm: '100%', md: '1000px' },
            alignItems: 'center',
            padding: { xs: 0, sm: 1 }
          }}
        >
          {topics &&
            Object.entries(topics).map(([topicTitle, topicItems]) => (
              <ListItem
                key={topicTitle}
                disablePadding
                sx={{
                  alignItems: 'flex-start',
                  flexDirection: { xs: 'column', sm: 'row' },
                  mb: { xs: 2, sm: 0 }
                }}
              >
                <ListItemText
                  sx={{
                    flex: { xs: 'auto', sm: 1 },
                    mb: { xs: 1, sm: 0 }
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      fontSize: { xs: '1.125rem', sm: '1.5rem' },
                      fontWeight: { xs: 600, sm: 'inherit' }
                    }}
                  >
                    {topicTitle}
                  </Typography>
                </ListItemText>
                <List
                  sx={{
                    pl: { xs: 0, sm: 2 },
                    flex: { xs: 'auto', sm: 3 },
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  {Object.entries(topicItems).map(([topicKey, topicValue]) => (
                    <ListItem key={topicKey} disablePadding>
                      <ListItemButton
                        onClick={() => handleTopicSelect(topicValue)}
                        sx={{
                          borderRadius: { xs: 1, sm: 0 },
                          mb: { xs: 0.5, sm: 0 },
                          '&:hover': {
                            backgroundColor: {
                              xs: 'rgba(0, 0, 0, 0.08)',
                              sm: 'rgba(0, 0, 0, 0.04)'
                            }
                          }
                        }}
                      >
                        <ListItemText
                          primary={topicValue}
                          slotProps={{
                            primary: {
                              sx: { fontSize: { xs: '0.875rem', sm: '1rem' } }
                            }
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </ListItem>
            ))}
        </List>
      </Stack>
    </Box>
  );
};

export default Page;
