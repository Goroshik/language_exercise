import { Paper, Typography } from '@mui/material';
import React from 'react';

interface EssayLevelProps {
  level: string;
}

export const EssayLevel: React.FC<EssayLevelProps> = ({ level }) => {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Результат проверки
      </Typography>
      <Typography variant="body1">
        <strong>Уровень:</strong> {level}
      </Typography>
    </Paper>
  );
};
