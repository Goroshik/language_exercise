import React from 'react';
import { CircularProgress, Typography } from '@mui/material';
import { StyledLoadingSpinner } from '../constants/styles';

interface LoadingSpinnerProps {
  message: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <StyledLoadingSpinner>
      <CircularProgress />
      <Typography sx={{ mt: 2 }}>{message}</Typography>
    </StyledLoadingSpinner>
  );
};

export default LoadingSpinner;
