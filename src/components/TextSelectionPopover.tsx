'use client';

import { Button, Paper } from '@mui/material';
import React, { useEffect, useRef } from 'react';

interface TextSelectionPopoverProps {
  position: { x: number; y: number };
  onTranslate: () => void;
  onClose: () => void;
}

// Delay before enabling click-outside handler to prevent immediate closure
const CLICK_OUTSIDE_DELAY = 100;

const TextSelectionPopover: React.FC<TextSelectionPopoverProps> = ({
  position,
  onTranslate,
  onClose
}) => {
  const popoverRef = useRef<globalThis.HTMLDivElement | null>(null);

  // Handle clicks outside the popover to close it
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as globalThis.Node)) {
        onClose();
      }
    };

    // Add event listener with a small delay to prevent immediate closure
    const timeoutId = window.setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, CLICK_OUTSIDE_DELAY);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <Paper
      ref={popoverRef}
      elevation={8}
      sx={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
        p: 1,
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0'
      }}
    >
      <Button variant="contained" size="small" onClick={onTranslate} sx={{ textTransform: 'none' }}>
        Перевести
      </Button>
    </Paper>
  );
};

export default TextSelectionPopover;
