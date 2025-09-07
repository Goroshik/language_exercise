import {styled} from '@mui/material/styles';
import {Box, Button, Paper, Stack, Typography} from '@mui/material';

// Header styled components
export const StyledHeader = styled(Box)({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: 24,
  color: 'white',
  paddingTop: 24,
  paddingBottom: 24,
  marginBottom: 32
});

// Exercise styled components
export const StyledExerciseBlock = styled(Box)({
  marginBottom: 32,
  padding: 24,
  border: '2px solid #1976d2',
  borderRadius: 16,
  backgroundColor: '#f8f9fa',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
});

export const StyledExerciseItem = styled(Stack)({
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 16,
  padding: 16,
  border: '1px solid #e0e0e0',
  borderRadius: 8,
  backgroundColor: 'white',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
});

// Topic styled components
export const StyledTopicHeader = styled(Box)({
  marginBottom: 24,
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: 16,
  backgroundColor: '#f5f5f5',
  borderRadius: 16
});

export const StyledTopicTitle = styled(Typography)({
  marginBottom: 16
});

// Loading styled components
export const StyledLoadingSpinner = styled(Box)({
  textAlign: 'center',
  paddingTop: 32,
  paddingBottom: 32
});

// Chat styled components
export const StyledChatDialog = styled('div')({
  '& .MuiDialog-paper': {
    height: '80vh',
    maxHeight: 600
  }
});

export const StyledMessagesContainer = styled(Box)({
  flexGrow: 1,
  overflowY: 'auto',
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 8
});

export const StyledMessageBubble = styled(Paper)({
  padding: 16,
  maxWidth: '70%',
  '&.user-message': {
    backgroundColor: '#1976d2',
    color: 'white'
  },
  '&.bot-message': {
    backgroundColor: '#f5f5f5',
    color: 'text.primary'
  }
});

export const StyledMessageTimestamp = styled(Typography)({
  display: 'block',
  marginTop: 4,
  opacity: 0.7,
  fontSize: '0.7rem'
});

export const StyledInputContainer = styled(Box)({
  padding: 16,
  borderTop: '1px solid',
  borderTopColor: 'divider',
  display: 'flex',
  gap: 8,
  alignItems: 'flex-end'
});

export const StyledSendButton = styled(Button)({
  minWidth: 'auto',
  padding: 8
});

// TextWithInputs styled components
export const StyledTextContainer = styled(Box)({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 8
});

export const StyledInputContainerWrapper = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start'
});

export const StyledErrorMessage = styled(Box)({
  fontSize: '0.75rem',
  color: '#d32f2f',
  marginTop: 4,
  maxWidth: 200,
  wordWrap: 'break-word'
});
