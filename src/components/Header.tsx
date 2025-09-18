import React from 'react';
import {AppBar, Box, Button, Toolbar, Typography} from '@mui/material';
import {Link as RouterLink} from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
          Изучение английского языка
        </Typography>
        <Box>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
            sx={{mr: 2}}
          >
            Главная
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/dictionary"
          >
            Словарь
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
