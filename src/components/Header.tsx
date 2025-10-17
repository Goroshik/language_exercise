'use client'

import React, {useState} from 'react';
import {AppBar, Box, Toolbar, Typography, IconButton, Tooltip} from '@mui/material';
import {useRouter} from "next/navigation";
import SettingsIcon from '@mui/icons-material/Settings';
import TopicIcon from '@mui/icons-material/Topic';
import BookIcon from '@mui/icons-material/Book';
import HistoryIcon from '@mui/icons-material/History';
import SettingsModal from './SettingsModal';

const Header: React.FC = () => {
  const route = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSettingsOpen = () => {
    setSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
            Изучение английского языка
          </Typography>
          <Box sx={{display: 'flex', gap: 1}}>
            <Tooltip title="Темы">
              <IconButton
                color="inherit"
                onClick={() => route.push('/topics')}
                sx={{backgroundColor: "white", color: "primary.main", "&:hover": {backgroundColor: "#f5f5f5"}}}
                aria-label="topics"
              >
                <TopicIcon/>
              </IconButton>
            </Tooltip>
            <Tooltip title="Словарь">
              <IconButton
                color="inherit"
                onClick={() => route.push('/dictionary')}
                sx={{backgroundColor: "white", color: "primary.main", "&:hover": {backgroundColor: "#f5f5f5"}}}
                aria-label="dictionary"
              >
                <BookIcon/>
              </IconButton>
            </Tooltip>
            <Tooltip title="История">
              <IconButton
                color="inherit"
                onClick={() => route.push('/exercises/generated-history')}
                sx={{backgroundColor: "white", color: "primary.main", "&:hover": {backgroundColor: "#f5f5f5"}}}
                aria-label="history"
              >
                <HistoryIcon/>
              </IconButton>
            </Tooltip>
            <Tooltip title="Настройки">
              <IconButton
                color="inherit"
                onClick={handleSettingsOpen}
                sx={{backgroundColor: "white", color: "primary.main", "&:hover": {backgroundColor: "#f5f5f5"}}}
                aria-label="settings"
              >
                <SettingsIcon/>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <SettingsModal
        open={settingsOpen}
        onClose={handleSettingsClose}
      />
    </>
  );
};

export default Header;
