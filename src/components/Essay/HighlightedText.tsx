import { Paper, Typography } from '@mui/material';
import React from 'react';
import { EssayError } from 'src/store/essayStore';

interface HighlightedTextProps {
  content: string;
  errors: EssayError[] | null;
  hoveredErrorIndex: number | null;
  selectedErrorIndex: number | null;
  onErrorHover: (index: number | null) => void;
  onErrorClick: (index: number | null) => void;
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({
  content,
  errors,
  hoveredErrorIndex,
  selectedErrorIndex,
  onErrorHover,
  onErrorClick
}) => {
  const renderHighlightedText = () => {
    if (!errors || errors.length === 0) {
      return (
        <Typography sx={{ whiteSpace: 'pre-wrap', fontSize: '16px', lineHeight: 1.8 }}>
          {content}
        </Typography>
      );
    }

    // Create a map of error positions to avoid conflicts
    const errorPositions: Array<{ start: number; end: number; index: number }> = [];

    errors.forEach((error, index) => {
      let searchStart = 0;
      let errorIndex = content.indexOf(error.text, searchStart);

      // Find the first occurrence that doesn't overlap with existing errors
      while (errorIndex !== -1) {
        const errorEnd = errorIndex + error.text.length;
        const hasOverlap = errorPositions.some(
          pos =>
            (errorIndex >= pos.start && errorIndex < pos.end) ||
            (errorEnd > pos.start && errorEnd <= pos.end) ||
            (errorIndex <= pos.start && errorEnd >= pos.end)
        );

        if (!hasOverlap) {
          errorPositions.push({ start: errorIndex, end: errorEnd, index });
          break;
        }

        searchStart = errorIndex + 1;
        errorIndex = content.indexOf(error.text, searchStart);
      }
    });

    // Sort by position
    errorPositions.sort((a, b) => a.start - b.start);

    let lastIndex = 0;
    const elements: React.ReactNode[] = [];

    errorPositions.forEach(({ start, end, index }) => {
      const highlightedError = errors[index];
      if (!highlightedError) {
        return;
      }

      // Add text before error
      if (start > lastIndex) {
        elements.push(<span key={`text-${index}`}>{content.substring(lastIndex, start)}</span>);
      }

      // Add highlighted error
      const isActive = hoveredErrorIndex === index || selectedErrorIndex === index;
      elements.push(
        <span
          key={`error-${index}`}
          style={{
            backgroundColor: highlightedError.color,
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: '3px',
            borderBottom: isActive ? '2px solid rgba(0,0,0,0.5)' : '1px solid rgba(0,0,0,0.15)',
            fontWeight: isActive ? 'bold' : 'normal',
            transition: 'all 0.2s'
          }}
          onMouseEnter={() => onErrorHover(index)}
          onMouseLeave={() => onErrorHover(null)}
          onClick={() => onErrorClick(selectedErrorIndex === index ? null : index)}
        >
          {content.substring(start, end)}
        </span>
      );

      lastIndex = end;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      elements.push(<span key="text-end">{content.substring(lastIndex)}</span>);
    }

    return (
      <Typography sx={{ whiteSpace: 'pre-wrap', fontSize: '16px', lineHeight: 1.8 }}>
        {elements}
      </Typography>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        minHeight: '400px',
        backgroundColor: '#fafafa',
        borderRadius: 2,
        border: '1px solid #e0e0e0',
        '& .MuiTypography-root': {
          fontSize: '16px',
          lineHeight: 1.8
        }
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 'bold', color: 'text.secondary' }}>
        Текст с отмеченными ошибками:
      </Typography>
      {errors && errors.length > 0 && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mb: 2,
            color: 'text.secondary',
            fontStyle: 'italic'
          }}
        >
          💡 Нажмите на ошибку для выделения
        </Typography>
      )}
      {errors && errors.length > 0 ? (
        renderHighlightedText()
      ) : (
        <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
          {content || 'Текст с отмеченными ошибками появится здесь после проверки'}
        </Typography>
      )}
    </Paper>
  );
};
