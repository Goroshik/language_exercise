'use client';

import React from 'react';
import { Alert, Stack } from '@mui/material';
import { useAlertStore } from 'src/store/alertStore';

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { alerts, removeAlert } = useAlertStore();

  const handleClose = (id: string) => {
    removeAlert(id);
  };

  return (
    <>
      {children}
      {alerts.length > 0 && (
        <Stack
          spacing={1}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 9999,
            maxWidth: 400
          }}
        >
          {alerts.map((alert) => (
            <Alert
              key={alert.id}
              onClose={() => handleClose(alert.id)}
              severity={alert.severity}
              variant="filled"
              sx={{ width: '100%' }}
            >
              {alert.message}
            </Alert>
          ))}
        </Stack>
      )}
    </>
  );
};
