'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useChatStore } from 'src/store/chatStore';
import { showAlert } from 'src/utils/alert';
import ConfirmDialog from './ConfirmDialog';

const ChatModal: React.FC = () => {
  const { messages, isOpen, isLoading, clearMessages, setIsOpen, sendMessage } = useChatStore();
  const [inputMessage, setInputMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const messagesEndRef = useRef<globalThis.HTMLDivElement | null>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">AI Помощник</Typography>
          <Box>
            <IconButton onClick={handleRefresh} size="small" sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
            <IconButton onClick={() => setIsOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            height: '500px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Messages area */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              mb: 2,
              p: 2,
              backgroundColor: '#f5f5f5',
              borderRadius: 1
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
                <Typography color="text.secondary">
                  Начните диалог с AI помощником
                </Typography>
              </Box>
            )}

            {messages.map((message, index) => (
              <Paper
                key={index}
                sx={{
                  p: 2,
                  mb: 1,
                  backgroundColor: message.role === 'user' ? '#e3f2fd' : '#fff',
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  ml: message.role === 'user' ? 'auto' : 0,
                  mr: message.role === 'assistant' ? 'auto' : 0
                }}
                elevation={1}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mb: 0.5 }}
                >
                  {message.role === 'user' ? 'Вы' : 'AI Помощник'}
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </Typography>
              </Paper>
            ))}

            {isLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  AI думает...
                </Typography>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          {/* Input area */}
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
      </DialogContent>
    </Dialog>

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

export default ChatModal;
