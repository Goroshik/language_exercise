import React from 'react';
import { CircularProgress, Typography, Backdrop } from '@mui/material';

interface LoadingOverlayProps {
  open: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ open, message = 'Загрузка...' }) => {
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: theme => theme.zIndex.drawer + 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        flexDirection: 'column',
        gap: 2
      }}
      open={open}
    >
      <CircularProgress color="inherit" size={60} />
      <Typography variant="h6">{message}</Typography>
    </Backdrop>
  );
};

export default LoadingOverlay;
