import React from 'react';
import { Typography } from '@mui/material';

interface LearnModeTextProps {
  text: string;
}

const LearnModeText: React.FC<LearnModeTextProps> = ({ text }) => {
  // Parse text and convert **bold** markings to actual bold text
  const parseTextWithBold = (text: string) => {
    const parts: (string | { type: 'bold'; text: string })[] = [];
    const regex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the bold part
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // Add the bold part
      parts.push({ type: 'bold', text: match[1] });

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  const parsedParts = parseTextWithBold(text);

  return (
    <Typography variant="body1" sx={{ lineHeight: 1.6, mb: 1 }}>
      {parsedParts.map((part, index) => {
        if (typeof part === 'string') {
          return (
            <span key={index}>
              {part}
            </span>
          );
        } else {
          return (
            <strong key={index} style={{ fontWeight: 'bold', color: '#1976d2' }}>
              {part.text}
            </strong>
          );
        }
      })}
    </Typography>
  );
};

export default LearnModeText;
