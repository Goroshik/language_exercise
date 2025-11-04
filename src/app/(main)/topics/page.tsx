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
      loadSettings();
    }
  }, [settings, loadSettings, setIsNavigating]);

  useEffect(() => {
    if (settings?.learningLanguage) {
      loadTopics(settings.learningLanguage);
      setState('topics-loaded');
    }
  }, [settings?.learningLanguage, loadTopics, setState]);

  return (
    <Box>
      <Typography variant="h6">
        {settings?.learningLanguage === 'pl'
          ? 'Wybierz temat gramatyki polskiej do nauki:'
          : 'Выберите тему английской грамматики для изучения:'}
      </Typography>
      <Stack direction="column" alignItems="center">
        <List sx={{ width: '1000px', alignItems: 'center' }}>
          {topics &&
            Object.entries(topics).map(([topicTitle, topicItems]) => (
              <ListItem key={topicTitle} disablePadding sx={{ alignItems: 'flex-start' }}>
                <ListItemText sx={{ flex: 1 }}>
                  <Typography variant="h5">{topicTitle}</Typography>
                </ListItemText>
                <List sx={{ pl: 2, flex: 3 }}>
                  {Object.entries(topicItems).map(([topicKey, topicValue]) => (
                    <ListItem key={topicKey} disablePadding>
                      <ListItemButton onClick={() => handleTopicSelect(topicValue)}>
                        <ListItemText primary={topicValue} />
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
