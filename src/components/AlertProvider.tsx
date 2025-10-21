'use client';

import React from 'react';
import { Alert, Snackbar, Stack } from '@mui/material';
import { useAlertStore } from 'src/store/alertStore';

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { alerts, removeAlert } = useAlertStore();

  const handleClose = (id: string) => {
    removeAlert(id);
  };

  return (
    <>
      {children}
      <Stack spacing={1} sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999 }}>
        {alerts.map((alert) => (
          <Snackbar
            key={alert.id}
            open={true}
            autoHideDuration={6000}
            onClose={() => handleClose(alert.id)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert
              onClose={() => handleClose(alert.id)}
              severity={alert.severity}
              sx={{ width: '100%' }}
              variant="filled"
            >
              {alert.message}
            </Alert>
          </Snackbar>
        ))}
      </Stack>
    </>
  );
};
