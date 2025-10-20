'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography
} from '@mui/material';

const Page: React.FC = () => {
  const navigate = useRouter();

  const [topics, setTopics] = useState<Record<string, Record<string, string>>>({});

  const handleTopicSelect = (topic: string) => {
    const path = topic
      .replace(/\s*\([^)]*\)/g, '')
      .toLowerCase()
      .replace(/\s+/g, '_');

    navigate.push(`/exercises/${path}`);
  };

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const response = await fetch('/api/topics');
      const data = await response.json();
      if (data.success) {
        setTopics(data.topics);
      }
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h6">Выберите тему английской грамматики для изучения:</Typography>
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
