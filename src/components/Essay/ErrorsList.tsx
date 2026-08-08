import { Box, Paper, Typography } from '@mui/material';
import React from 'react';
import { EssayError } from 'src/store/essayStore';

interface ErrorsListProps {
  errors: EssayError[];
  hoveredErrorIndex: number | null;
  selectedErrorIndex: number | null;
  onErrorHover: (index: number | null) => void;
  onErrorClick: (index: number | null) => void;
}

export const ErrorsList: React.FC<ErrorsListProps> = ({
  errors,
  hoveredErrorIndex,
  selectedErrorIndex,
  onErrorHover,
  onErrorClick
}) => {
  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          mb: 2,
          fontWeight: 600
        }}
      >
        Найденные ошибки ({errors.length}):
      </Typography>
      {errors.length > 0 ? (
        <Box component="ul" sx={{ pl: 0, listStyle: 'none', m: 0 }}>
          {errors.map((error, index) => {
            const isActive = hoveredErrorIndex === index || selectedErrorIndex === index;
            return (
              <Box
                component="li"
                key={index}
                sx={{
                  mb: 2,
                  pb: 2,
                  borderBottom: index < errors.length - 1 ? '1px solid #e0e0e0' : 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  padding: '12px',
                  borderRadius: 1,
                  backgroundColor: isActive ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.02)'
                  },
                  fontWeight: isActive ? 'bold' : 'normal',
                  border:
                    selectedErrorIndex === index ? '2px solid #1976d2' : '2px solid transparent'
                }}
                onMouseEnter={() => onErrorHover(index)}
                onMouseLeave={() => onErrorHover(null)}
                onClick={() => onErrorClick(selectedErrorIndex === index ? null : index)}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: error.color,
                      mr: 2,
                      fontWeight: 'bold',
                      fontSize: '16px',
                      color: '#fff',
                      flexShrink: 0
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      sx={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        mb: 0.5,
                        color: 'text.primary'
                      }}
                    >
                      {error.text}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '15px',
                        lineHeight: 1.6,
                        color: 'text.secondary'
                      }}
                    >
                      {error.explanation}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      ) : (
        <Typography
          variant="body2"
          sx={{
            color: 'success.main'
          }}
        >
          Ошибок не найдено! 🎉
        </Typography>
      )}
    </Paper>
  );
};
