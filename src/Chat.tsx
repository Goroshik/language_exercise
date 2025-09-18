import React, {useState} from 'react';
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  TextField,
  Typography
} from '@mui/material';

import GoogleAIService from './services/googleAI';
import {CHAT_PROMPTS} from './prompts/chatPrompts';
import {
  StyledChatDialog,
  StyledInputContainer,
  StyledMessageBubble,
  StyledMessagesContainer,
  StyledMessageTimestamp,
  StyledSendButton
} from './constants/styles';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatProps {
  open: boolean;
  onClose: () => void;
}


const Chat: React.FC<ChatProps> = ({open, onClose}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = (text: string, isUser: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    addMessage(userMessage, true);
    setIsLoading(true);

    try {
      const systemPrompt = CHAT_PROMPTS.systemPrompt(userMessage);

      const response = await GoogleAIService.generateText(systemPrompt);

      if (response.error) {
        addMessage(`Ошибка: ${response.error}`, false);
      } else {
        addMessage(response.text, false);
      }
    } catch (error) {
      addMessage('Произошла ошибка при обращении к AI. Попробуйте снова.', false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <StyledChatDialog>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Typography variant="h6">
            Чат-помощник по польскому языку
          </Typography>
          <IconButton onClick={onClose} size="small">
            Close
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{display: 'flex', flexDirection: 'column', p: 0}}>
          {/* Messages area */}
          <StyledMessagesContainer>
            {messages.length === 0 && (
              <Box sx={{textAlign: 'center', color: 'text.secondary', mt: 4}}>
                <Typography variant="body2">
                  Привет! Я помогу вам с изучением польского языка.
                </Typography>
                <Typography variant="body2">
                  Задавайте вопросы о грамматике, словах, произношении или культуре Польши.
                </Typography>
              </Box>
            )}

            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                  mb: 1
                }}
              >
                <StyledMessageBubble
                  className={message.isUser ? 'user-message' : 'bot-message'}
                >
                  <Typography variant="body2" sx={{whiteSpace: 'pre-wrap'}}>
                    {message.text}
                  </Typography>
                  <StyledMessageTimestamp variant="caption">
                    {message.timestamp.toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </StyledMessageTimestamp>
                </StyledMessageBubble>
              </Box>
            ))}

            {isLoading && (
              <Box sx={{display: 'flex', justifyContent: 'flex-start', mb: 1}}>
                <Paper sx={{p: 2, backgroundColor: '#f5f5f5'}}>
                  <CircularProgress size={20}/>
                  <Typography variant="body2" sx={{ml: 1, display: 'inline'}}>
                    Печатаю...
                  </Typography>
                </Paper>
              </Box>
            )}
          </StyledMessagesContainer>

          {/* Input area */}
          <StyledInputContainer>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              placeholder="Задайте вопрос о польском языке..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              variant="outlined"
              size="small"
            />
            <StyledSendButton
              variant="contained"
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              Send
            </StyledSendButton>
          </StyledInputContainer>
        </DialogContent>
      </Dialog>
    </StyledChatDialog>
  );
};

export default Chat;
