import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, IconButton, Typography, Stack, useTheme } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

interface ExerciseCarouselProps {
  children: React.ReactElement[];
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
}

const ExerciseCarousel: React.FC<ExerciseCarouselProps> = ({
  children,
  currentIndex: externalIndex,
  onIndexChange
}) => {
  const [internalIndex, setInternalIndex] = useState(0);
  const currentIndex = externalIndex !== undefined ? externalIndex : internalIndex;
  const carouselRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  const totalBlocks = children.length;

  useEffect(() => {
    // Auto-scroll to the last block when new blocks are added
    if (externalIndex === undefined) {
      setInternalIndex(totalBlocks - 1);
    }
  }, [totalBlocks, externalIndex]);

  const handlePrevious = useCallback(() => {
    const newIndex = Math.max(0, currentIndex - 1);
    if (externalIndex === undefined) {
      setInternalIndex(newIndex);
    }
    onIndexChange?.(newIndex);
  }, [currentIndex, externalIndex, onIndexChange]);

  const handleNext = useCallback(() => {
    const newIndex = Math.min(totalBlocks - 1, currentIndex + 1);
    if (externalIndex === undefined) {
      setInternalIndex(newIndex);
    }
    onIndexChange?.(newIndex);
  }, [currentIndex, totalBlocks, externalIndex, onIndexChange]);

  // Add keyboard navigation only when carousel is focused
  useEffect(() => {
    const carouselElement = carouselRef.current;
    if (!carouselElement) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrevious();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleNext();
      }
    };

    carouselElement.addEventListener('keydown', handleKeyDown);
    return () => carouselElement.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevious, handleNext]);

  const goToBlock = useCallback((index: number) => {
    if (externalIndex === undefined) {
      setInternalIndex(index);
    }
    onIndexChange?.(index);
  }, [externalIndex, onIndexChange]);

  if (totalBlocks === 0) {
    return null;
  }

  return (
    <Box ref={carouselRef} tabIndex={0} sx={{ outline: 'none', '&:focus': { outline: 'none' } }}>
      {/* Carousel Container */}
      <Box sx={{ position: 'relative', minHeight: '300px' }}>
        {/* Navigation Buttons */}
        <IconButton
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          aria-label="Предыдущий блок"
          sx={{
            position: 'absolute',
            left: { xs: -10, sm: -20 },
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1,
            backgroundColor: 'white',
            boxShadow: 2,
            '&:hover': {
              backgroundColor: theme.palette.grey[100]
            },
            '&.Mui-disabled': {
              backgroundColor: theme.palette.grey[100],
              opacity: 0.5
            }
          }}
        >
          <ChevronLeft />
        </IconButton>

        <IconButton
          onClick={handleNext}
          disabled={currentIndex === totalBlocks - 1}
          aria-label="Следующий блок"
          sx={{
            position: 'absolute',
            right: { xs: -10, sm: -20 },
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1,
            backgroundColor: 'white',
            boxShadow: 2,
            '&:hover': {
              backgroundColor: theme.palette.grey[100]
            },
            '&.Mui-disabled': {
              backgroundColor: theme.palette.grey[100],
              opacity: 0.5
            }
          }}
        >
          <ChevronRight />
        </IconButton>

        {/* Current Block */}
        <Box sx={{ padding: { xs: '0 20px', sm: '0 30px' } }}>
          {children[currentIndex]}
        </Box>
      </Box>

      {/* Pagination Indicators */}
      <Stack
        direction="row"
        spacing={1}
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
          mt: 3,
          mb: 2,
          flexWrap: 'wrap',
          maxWidth: '100%',
          gap: 1
        }}
      >
        {children.map((_, index) => (
          <Box
            key={index}
            onClick={() => goToBlock(index)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                goToBlock(index);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Перейти к блоку ${index + 1}`}
            aria-current={index === currentIndex ? 'true' : 'false'}
            sx={{
              minWidth: { xs: '32px', sm: '40px' },
              height: { xs: '32px', sm: '40px' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: index === currentIndex ? theme.palette.primary.main : theme.palette.grey[300],
              color: index === currentIndex ? theme.palette.primary.contrastText : theme.palette.text.secondary,
              fontWeight: index === currentIndex ? 'bold' : 'normal',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: index === currentIndex ? theme.palette.primary.dark : theme.palette.grey[400],
                transform: 'scale(1.1)'
              },
              '&:focus': {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: '2px'
              }
            }}
          >
            <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {index + 1}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export default ExerciseCarousel;
