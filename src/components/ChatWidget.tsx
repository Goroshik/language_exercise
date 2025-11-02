'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  CircularProgress,
  Collapse,
  Fab
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import ChatIcon from '@mui/icons-material/Chat';
import { useChatStore } from 'src/store/chatStore';
import { showAlert } from 'src/utils/alert';
import ConfirmDialog from './ConfirmDialog';

const ChatWidget: React.FC = () => {
  const { messages, isOpen, isLoading, clearMessages, setIsOpen, sendMessage } = useChatStore();
  const [inputMessage, setInputMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const messagesEndRef = useRef<globalThis.HTMLDivElement | null>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

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

  const handleConfirmClear = () => {
    clearMessages();
    setConfirmOpen(false);
    showAlert.success('История чата очищена');
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
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
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
            bottom: 96,
            right: 24,
            width: 380,
            maxWidth: 'calc(100vw - 48px)',
            height: 500,
            maxHeight: 'calc(100vh - 120px)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
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
              <Paper
                key={index}
                sx={{
                  p: 1.5,
                  backgroundColor: message.role === 'user' ? '#e3f2fd' : '#fff',
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  wordBreak: 'break-word'
                }}
                elevation={1}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}
                >
                  {message.role === 'user' ? 'Вы' : 'AI'}
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </Typography>
              </Paper>
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
        title="Очистить историю чата"
        message="Вы уверены, что хотите очистить историю чата? Это действие нельзя отменить."
        onConfirm={handleConfirmClear}
        onCancel={handleCancelClear}
        confirmText="Очистить"
        cancelText="Отмена"
      />
    </>
  );
};

export default ChatWidget;
