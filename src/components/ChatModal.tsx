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
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from 'src/store/chatStore';
import { useSettingsStore } from 'src/store/settingsStore';
import ConfirmDialog from './ConfirmDialog';
import MarkdownMessage from './MarkdownMessage';

const ChatModal: React.FC = () => {
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
  const messagesEndRef = useRef<globalThis.HTMLDivElement | null>(null);

  // Update current language in chat store when it changes
  useEffect(() => {
    if (settings?.learningLanguage) {
      setCurrentLanguage(settings.learningLanguage);
    }
  }, [settings?.learningLanguage, setCurrentLanguage]);

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
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            ...(isMobile ? {
              margin: 0,
              maxHeight: '100vh',
              height: '100vh',
              borderRadius: 0,
              display: 'flex',
              flexDirection: 'column'
            } : {
              height: '80vh',
              maxHeight: '800px',
              display: 'flex',
              flexDirection: 'column'
            })
          }
        }}
      >
        <DialogTitle sx={{ pb: isMobile ? 1 : 2, px: isMobile ? 2 : 3, flexShrink: 0 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>
              AI Помощник
            </Typography>
            <Box>
              <IconButton 
                onClick={handleRefresh} 
                size="small" 
                sx={{ mr: 0.5 }}
              >
                <RefreshIcon fontSize={isMobile ? 'small' : 'medium'} />
              </IconButton>
              <IconButton 
                onClick={() => setIsOpen(false)} 
                size="small"
              >
                <CloseIcon fontSize={isMobile ? 'small' : 'medium'} />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent 
          sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            p: 0,
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              p: isMobile ? 1.5 : 2,
              overflow: 'hidden'
            }}
          >
            {/* Messages area */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                mb: isMobile ? 1.5 : 2,
                p: isMobile ? 1.5 : 2,
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
                  <Typography 
                    color="text.secondary"
                    sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                  >
                    Начните диалог с AI помощником
                  </Typography>
                </Box>
              )}

              {messages.map((message, index) => (
                <MarkdownMessage key={index} content={message.content} role={message.role} />
              ))}

              {isLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <CircularProgress size={isMobile ? 16 : 20} />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                  >
                    AI думает...
                  </Typography>
                </Box>
              )}

              <div ref={messagesEndRef} />
            </Box>

            {/* Input area */}
            <Box sx={{ display: 'flex', gap: isMobile ? 0.5 : 1 }}>
              <TextField
                fullWidth
                multiline
                maxRows={isMobile ? 2 : 3}
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Введите ваш вопрос..."
                disabled={isLoading}
                variant="outlined"
                size={isMobile ? 'small' : 'small'}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }
                }}
              />
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': { backgroundColor: 'primary.dark' },
                  '&.Mui-disabled': { backgroundColor: '#e0e0e0', color: '#9e9e9e' },
                  flexShrink: 0
                }}
              >
                <SendIcon fontSize={isMobile ? 'small' : 'medium'} />
              </IconButton>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

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

export default ChatModal;
