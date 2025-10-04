import React from 'react';
import {Box, CircularProgress, Typography} from '@mui/material';

interface LoadingSpinnerProps {
  message: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <Box sx={{textAlign: 'center',
      paddingTop: 32,
      paddingBottom: 32}}>
      <CircularProgress />
      <Typography sx={{ mt: 2 }}>{message}</Typography>
    </Box>
  );
};

export default LoadingSpinner;
