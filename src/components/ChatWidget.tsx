'use client';

import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import {
  Box,
  CircularProgress,
  Collapse,
  Fab,
  IconButton,
  Paper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useChatStore } from 'src/store/chatStore';
import { useSettingsStore } from 'src/store/settingsStore';
import ConfirmDialog from './ConfirmDialog';
import MarkdownMessage from './MarkdownMessage';

const MIN_WIDTH = 320;
const MIN_HEIGHT = 400;
const MAX_WIDTH = 800;
const MAX_HEIGHT = 900;
const DEFAULT_WIDTH = 380;
const DEFAULT_HEIGHT = 500;
const MOBILE_BOTTOM_OFFSET = 160; // Bottom offset for mobile chat widget
const DESKTOP_BOTTOM_OFFSET = 120; // Bottom offset for desktop chat widget

const ChatWidget: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const {
    messages,
    isOpen,
    isLoading,
    setIsOpen,
    sendMessage,
    loadHistory,
    clearHistory,
    setCurrentLanguage
  } = useChatStore();
  const { settings } = useSettingsStore();
  const [inputMessage, setInputMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  const [isResizing, setIsResizing] = useState(false);
  const messagesEndRef = useRef<globalThis.HTMLDivElement | null>(null);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  // Update current language in chat store when it changes
  useEffect(() => {
    if (settings?.learningLanguage) {
      setCurrentLanguage(settings.learningLanguage);
    }
  }, [settings?.learningLanguage, setCurrentLanguage]);

  // Load history when widget opens
  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, loadHistory]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Handle resize start
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile) return; // Disable resize on mobile
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startWidth: size.width,
        startHeight: size.height
      };
    },
    [size, isMobile]
  );

  // Handle resize move
  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !resizeRef.current || isMobile) return;

      const deltaX = resizeRef.current.startX - e.clientX;
      const deltaY = resizeRef.current.startY - e.clientY;

      const newWidth = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, resizeRef.current.startWidth + deltaX)
      );
      const newHeight = Math.min(
        MAX_HEIGHT,
        Math.max(MIN_HEIGHT, resizeRef.current.startHeight + deltaY)
      );

      setSize({ width: newWidth, height: newHeight });
    },
    [isResizing, isMobile]
  );

  // Handle resize end
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    resizeRef.current = null;
  }, []);

  // Add/remove mouse event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'nwse-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage.trim();
    setInputMessage('');

    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRefresh = () => {
    setConfirmOpen(true);
  };

  const handleConfirmClear = async () => {
    await clearHistory();
    setConfirmOpen(false);
  };

  const handleCancelClear = () => {
    setConfirmOpen(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="chat"
        onClick={() => setIsOpen(!isOpen)}
        size={isMobile ? 'medium' : 'large'}
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          zIndex: 1000
        }}
      >
        <ChatIcon />
      </Fab>

      {/* Chat Widget */}
      <Collapse in={isOpen} timeout={300}>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: { xs: 72, sm: 96 },
            right: { xs: 8, sm: 24 },
            left: { xs: 8, sm: 'auto' },
            width: isMobile ? 'calc(100vw - 16px)' : `${size.width}px`,
            height: isMobile ? `calc(100vh - ${MOBILE_BOTTOM_OFFSET}px)` : `${size.height}px`,
            maxWidth: isMobile ? '100%' : 'calc(100vw - 48px)',
            maxHeight: isMobile ? `calc(100vh - ${MOBILE_BOTTOM_OFFSET}px)` : `calc(100vh - ${DESKTOP_BOTTOM_OFFSET}px)`,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            overflow: 'hidden',
            transition: isResizing ? 'none' : 'opacity 0.3s'
          }}
        >
          {/* Resize Handle - only on desktop */}
          {!isMobile && (
            <Box
              onMouseDown={handleResizeStart}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 40,
                height: 40,
                cursor: 'nwse-resize',
                zIndex: 10,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                '&:hover .resize-indicator': {
                  opacity: 1
                }
              }}
            >
              <Box
                className="resize-indicator"
                sx={{
                  width: 0,
                  height: 0,
                  borderLeft: '20px solid transparent',
                  borderTop: '20px solid',
                  borderTopColor: 'rgba(255, 255, 255, 0.3)',
                  opacity: 0.5,
                  transition: 'opacity 0.2s',
                  pointerEvents: 'none'
                }}
              />
            </Box>
          )}

          {/* Header */}
          <Box
            sx={{
              p: { xs: 1.5, sm: 2 },
              backgroundColor: 'primary.main',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              AI Помощник
            </Typography>
            <Box>
              <IconButton onClick={handleRefresh} size="small" sx={{ color: 'white', mr: 1 }}>
                <RefreshIcon />
              </IconButton>
              <IconButton onClick={() => setIsOpen(false)} size="small" sx={{ color: 'white' }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Messages area */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              backgroundColor: '#f5f5f5',
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}
          >
            {messages.length === 0 && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%'
                }}
              >
                <Typography color="text.secondary" align="center">
                  Начните диалог с AI помощником
                </Typography>
              </Box>
            )}

            {messages.map((message, index) => (
              <MarkdownMessage key={index} content={message.content} role={message.role} />
            ))}

            {isLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  AI думает...
                </Typography>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          {/* Input area */}
          <Box sx={{ p: 2, backgroundColor: 'white', borderTop: '1px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                multiline
                maxRows={3}
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Введите ваш вопрос..."
                disabled={isLoading}
                variant="outlined"
                size="small"
              />
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': { backgroundColor: 'primary.dark' },
                  '&.Mui-disabled': { backgroundColor: '#e0e0e0', color: '#9e9e9e' }
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Collapse>

      <ConfirmDialog
        open={confirmOpen}
        title="Начать новый чат"
        message="Вы хотите начать новый чат? Текущая переписка сохранится в истории."
        onConfirm={handleConfirmClear}
        onCancel={handleCancelClear}
        confirmText="Начать новый"
        cancelText="Отмена"
      />
    </>
  );
};

export default ChatWidget;
