import React from 'react';
import { Typography } from '@mui/material';
import { StyledHeader } from '../constants/styles';

const Header: React.FC = () => {
  return (
    <StyledHeader sx={{ textAlign: 'center' }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom
        className="header-title"
      >
        Изучение английского языка
      </Typography>
      <Typography 
        variant="subtitle1"
      >
        Практикуйте английскую грамматику с помощью интерактивных упражнений
      </Typography>
    </StyledHeader>
  );
};

export default Header;
