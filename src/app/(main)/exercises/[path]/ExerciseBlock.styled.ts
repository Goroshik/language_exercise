import { Box, Stack, styled, Typography } from '@mui/material';

export const ExerciseBlockContainer = styled(Stack)(() => ({
  marginBottom: 16,
  padding: 0,
  border: 'none',
  borderRadius: 0,
  backgroundColor: 'transparent',
  boxShadow: 'none'
}));

export const ExerciseBlockTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  color: '#1976d2'
}));

export const ExerciseBlockCaption = styled(Typography)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  color: theme.palette.text.secondary
}));

export const ExerciseBlockInner = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  backgroundColor: 'white',
  borderRadius: 8,
  border: '1px solid #e0e0e0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.75)
  }
}));

export const ExerciseRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(1)
  }
}));

export const ExerciseIndex = styled(Typography)(({ theme }) => ({
  minWidth: 'auto',
  paddingTop: theme.spacing(0.5),
  color: theme.palette.text.secondary
}));

export const ExerciseContent = styled(Box)(() => ({
  flex: 1
}));

export const CheckButtonBox = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  marginTop: theme.spacing(2)
}));
