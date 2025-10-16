'use client'

import React, {useState} from 'react';
import {AppBar, Box, Button, Toolbar, Typography, IconButton} from '@mui/material';
import {useRouter} from "next/navigation";
import SettingsIcon from '@mui/icons-material/Settings';
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
          <Box>
            <Button variant="outlined" onClick={() => route.push('/topics')} sx={{mr: 2, backgroundColor: "white"}}>
              Темы
            </Button>
            <Button variant="outlined" onClick={() => route.push('/dictionary')} sx={{mr: 2, backgroundColor: "white"}}>
              Словарь
            </Button>
            <Button variant="outlined" onClick={() => route.push('/exercises/generated-history')} sx={{mr: 2, backgroundColor: "white"}}>
              История
            </Button>
            <IconButton
              color="inherit"
              onClick={handleSettingsOpen}
              sx={{ml: 1, backgroundColor: "white", color: "primary.main", "&:hover": {backgroundColor: "#f5f5f5"}}}
              aria-label="settings"
            >
              <SettingsIcon/>
            </IconButton>
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
