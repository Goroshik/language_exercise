import React from 'react';
import {useNavigate} from 'react-router-dom';

import {Box, List, ListItem, ListItemButton, ListItemText, Typography} from '@mui/material';

import {StyledTopicTitle} from '../../constants/styles';

interface TopicSelectionProps {
  topics: Record<string, Record<string, string>>;
  onTopicSelect?: (topic: string) => void;
}

const Index: React.FC<TopicSelectionProps> = ({topics}) => {
  const navigate = useNavigate();

  const handleTopicSelect = (topic: string) => {
    const path = topic.replace(/\s*\([^)]*\)/g, '').toLowerCase().replace(/\s+/g, '_');

    navigate(`/topic/${path}`);
  };

  return (
    <Box>
      <StyledTopicTitle variant="h6">
        Выберите тему английской грамматики для изучения:
      </StyledTopicTitle>
      <List>
        {Object.entries(topics).map(([topicTitle, topicItems]) => (
          <ListItem key={topicTitle} disablePadding sx={{display: 'block'}}>
            <ListItemText>
              <Typography variant="h5">{topicTitle}</Typography>
            </ListItemText>
            <List sx={{pl: 2}}>
              {Object.entries(topicItems).map(([topicKey, topicValue]) => (
                <ListItem key={topicKey} disablePadding>
                  <ListItemButton onClick={() => handleTopicSelect(topicValue)}>
                    <ListItemText primary={topicValue}/>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Index;
