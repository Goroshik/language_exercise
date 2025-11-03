'use client';

import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from 'src/store/chatStore';
import ConfirmDialog from './ConfirmDialog';
import MarkdownMessage from './MarkdownMessage';

const ChatModal: React.FC = () => {
  const { messages, isOpen, isLoading, setIsOpen, sendMessage, loadHistory, clearHistory } = useChatStore();
  const [inputMessage, setInputMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const messagesEndRef = useRef<globalThis.HTMLDivElement | null>(null);

  // Load history when modal opens
  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, loadHistory]);

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

  const handleConfirmClear = async () => {
    await clearHistory();
    setConfirmOpen(false);
  };

  const handleCancelClear = () => {
    setConfirmOpen(false);
  };

  return (
    <>
      <Dialog 
        open={isOpen} 
        onClose={() => setIsOpen(false)} 
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '80vh',
            maxHeight: '800px',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
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
      <DialogContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            p: 2
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
              borderRadius: 1,
              display: 'flex',
              flexDirection: 'column'
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
              <MarkdownMessage
                key={index}
                content={message.content}
                role={message.role}
              />
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
