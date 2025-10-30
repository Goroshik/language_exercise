'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography
} from '@mui/material';
import { showAlert } from 'src/utils/alert';

import { useAppStore } from 'src/store/appStore';

const Page: React.FC = () => {
  const navigate = useRouter();
  const { setIsNavigating, setState } = useAppStore();

  const [topics, setTopics] = useState<Record<string, Record<string, string>>>({});
  const [learningLanguage, setLearningLanguage] = useState<string>('en');

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
    loadUserSettings();

    // Listen for language change events
    const handleLanguageChange = () => {
      loadUserSettings();
    };

    window.addEventListener('learningLanguageChanged', handleLanguageChange);

    return () => {
      window.removeEventListener('learningLanguageChanged', handleLanguageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const settings = await response.json();
        const language = settings.learningLanguage || 'en';
        setLearningLanguage(language);
        loadTopics(language);
      } else {
        loadTopics('en');
      }
    } catch {
      loadTopics('en');
    }
  };

  const loadTopics = async (language: string) => {
    try {
      const response = await fetch(`/api/topics?language=${language}`);
      const data = await response.json();
      if (data.success) {
        setTopics(data.topics);
        setState('topics-loaded');
      }
    } catch {
      showAlert.error('Failed to load topics');
    }
  };

  return (
    <Box>
      <Typography variant="h6">
        {learningLanguage === 'pl'
          ? 'Wybierz temat gramatyki polskiej do nauki:'
          : 'Выберите тему английской грамматики для изучения:'}
      </Typography>
      <Stack direction="column" alignItems="center">
        <List sx={{ width: '1000px', alignItems: 'center' }}>
          {Object.entries(topics).map(([topicTitle, topicItems]) => (
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
