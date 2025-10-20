'use client';
import { createTheme } from '@mui/material/styles';

export default createTheme({
  typography: {
    h1: {
      fontWeight: 700,
      textShadow: '0 2px 4px rgba(0,0,0,0.3)'
    },
    h4: {
      fontWeight: 700,
      textShadow: '0 2px 4px rgba(0,0,0,0.3)'
    },
    h6: {
      fontWeight: 600
    },
    subtitle1: {
      opacity: 0.9,
      fontSize: '1.1rem'
    },
    body2: {
      fontSize: '0.875rem'
    },
    caption: {
      fontSize: '0.75rem'
    }
  },
  components: {
    MuiTypography: {
      styleOverrides: {
        root: {
          '&.header-title': {
            fontWeight: 700,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          '&.check-button': {
            paddingLeft: 24,
            paddingRight: 24,
            paddingTop: 8,
            paddingBottom: 8,
            borderRadius: 16,
            textTransform: 'none',
            fontWeight: 600
          },
          '&.add-more-button': {
            paddingLeft: 32,
            paddingRight: 32,
            paddingTop: 12,
            paddingBottom: 12,
            borderRadius: 24,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '1.1rem'
          },
          '&.fab-button': {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
            }
          }
        }
      }
    },
    MuiFab: {
      styleOverrides: {
        root: {
          '&.gradient-fab': {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
            }
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '&.exercise-input': {
            minWidth: 100,
            '& .MuiOutlinedInput-root': {
              height: '2em',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }
          },
          '&.exercise-input-correct': {
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#c8e6c9',
              '&:hover': {
                backgroundColor: '#c8e6c9'
              },
              '&.Mui-focused': {
                backgroundColor: '#c8e6c9'
              }
            }
          },
          '&.exercise-input-incorrect': {
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#ffcdd2',
              '&:hover': {
                backgroundColor: '#ffcdd2'
              },
              '&.Mui-focused': {
                backgroundColor: '#ffcdd2'
              }
            }
          }
        }
      }
    }
  }
});
