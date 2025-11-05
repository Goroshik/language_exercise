import { Typography, styled } from '@mui/material';

export const LearnModeTextTypography = styled(Typography)(({ theme }) => ({
  lineHeight: 1.6,
  marginBottom: theme.spacing(1)
}));

export const LearnModeTextBold = styled('strong')(() => ({
  fontWeight: 'bold',
  color: '#1976d2',
  cursor: 'text'
}));

export const LearnModeTextSpan = styled('span')(() => ({
  cursor: 'text'
}));
