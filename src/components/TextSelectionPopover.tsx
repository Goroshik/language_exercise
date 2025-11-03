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

// Button text for translation action
const TRANSLATE_BUTTON_TEXT = 'Перевести';

// Z-index for the popover (below translation panel which uses 10000)
const POPOVER_Z_INDEX = 9999;

const TextSelectionPopover: React.FC<TextSelectionPopoverProps> = ({
  position,
  onTranslate,
  onClose
}) => {
  const popoverRef = useRef<globalThis.HTMLDivElement | null>(null);

  // Handle clicks outside the popover to close it
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (
        popoverRef.current &&
        event.target &&
        !popoverRef.current.contains(event.target as globalThis.Node)
      ) {
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
        zIndex: POPOVER_Z_INDEX,
        p: 1,
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0'
      }}
    >
      <Button variant="contained" size="small" onClick={onTranslate} sx={{ textTransform: 'none' }}>
        {TRANSLATE_BUTTON_TEXT}
      </Button>
    </Paper>
  );
};

export default TextSelectionPopover;
