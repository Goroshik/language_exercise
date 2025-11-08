import { Paper, Typography } from '@mui/material';
import React from 'react';

interface EssaySummaryProps {
  summary: string;
}

export const EssaySummary: React.FC<EssaySummaryProps> = ({ summary }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        backgroundColor: '#f5f5f5',
        borderLeft: '4px solid #1976d2'
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 'bold',
          mb: 1,
          color: '#1976d2'
        }}
      >
        Общая оценка:
      </Typography>
      <Typography
        sx={{
          fontSize: '15px',
          lineHeight: 1.7,
          color: 'text.primary'
        }}
      >
        {summary}
      </Typography>
    </Paper>
  );
};
