'use client';

import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Link,
    TextField,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { showAlert } from 'src/utils/alert';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

interface UserToken {
  id: string;
  service: string;
  token: string;
  createdAt: string;
  updatedAt: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Token management state
  const [tokens, setTokens] = useState<Record<string, string>>({
    gemini: '',
    openai: '',
    anthropic: '',
    deepl: ''
  });

  // Load user data when modal opens
  useEffect(() => {
    if (open) {
      loadUserTokens();
    }
  }, [open]);

  const loadUserTokens = async () => {
    try {
      const response = await fetch('/api/tokens');
      if (response.ok) {
        const tokenData: UserToken[] = await response.json();
        const tokenMap: Record<string, string> = {};
        tokenData.forEach(token => {
          tokenMap[token.service] = token.token;
        });
        setTokens(prev => ({ ...prev, ...tokenMap }));
      }
    } catch {
      showAlert.error('Failed to load tokens');
    }
  };

  const handleTokenChange = (service: string, value: string) => {
    setTokens(prev => ({
      ...prev,
      [service]: value
    }));
  };

  const saveTokens = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      for (const [service, token] of Object.entries(tokens)) {
        if (token.trim()) {
          await fetch('/api/tokens', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              service,
              token: token.trim()
            })
          });
        }
      }
      setSuccess('Tokens saved successfully!');
    } catch {
      setError('Failed to save tokens');
      showAlert.error('Failed to save tokens');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
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
            maxHeight: '90vh'
          })
        }
      }}
    >
      <DialogTitle sx={{ pb: isMobile ? 1 : 2, px: isMobile ? 2 : 3, flexShrink: 0 }}>
        API Tokens
      </DialogTitle>

      <DialogContent 
        sx={{ 
          px: isMobile ? 2 : 3, 
          pt: isMobile ? 1 : 2,
          pb: isMobile ? 2 : 2,
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box>
          <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>
            API Tokens
          </Typography>
          <Typography 
            variant="body2" 
            color="textSecondary" 
            paragraph
            sx={{ fontSize: isMobile ? '0.875rem' : '0.875rem' }}
          >
            Enter your API tokens for different services. These will be encrypted and stored
            securely.
          </Typography>

          <TextField
            label="Gemini API Token"
            variant="outlined"
            fullWidth
            margin="normal"
            type="password"
            value={tokens.gemini}
            onChange={e => handleTokenChange('gemini', e.target.value)}
            placeholder="Enter your Gemini API token"
            size={isMobile ? 'small' : 'medium'}
            helperText={
              <>
                Get your token from{' '}
                <Link
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google AI Studio
                </Link>
              </>
            }
            sx={{
              '& .MuiInputBase-root': {
                fontSize: isMobile ? '0.875rem' : '1rem'
              },
              '& .MuiFormHelperText-root': {
                fontSize: isMobile ? '0.75rem' : '0.75rem'
              }
            }}
          />

          <TextField
            label="OpenAI API Token"
            variant="outlined"
            fullWidth
            margin="normal"
            type="password"
            value={tokens.openai}
            onChange={e => handleTokenChange('openai', e.target.value)}
            placeholder="Enter your OpenAI API token"
            size={isMobile ? 'small' : 'medium'}
            helperText={
              <>
                Get your token from{' '}
                <Link
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  OpenAI Platform
                </Link>
              </>
            }
            sx={{
              '& .MuiInputBase-root': {
                fontSize: isMobile ? '0.875rem' : '1rem'
              },
              '& .MuiFormHelperText-root': {
                fontSize: isMobile ? '0.75rem' : '0.75rem'
              }
            }}
          />

          <TextField
            label="Anthropic API Token"
            variant="outlined"
            fullWidth
            margin="normal"
            type="password"
            value={tokens.anthropic}
            onChange={e => handleTokenChange('anthropic', e.target.value)}
            placeholder="Enter your Anthropic API token"
            size={isMobile ? 'small' : 'medium'}
            helperText={
              <>
                Get your token from{' '}
                <Link
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Anthropic Console
                </Link>
              </>
            }
            sx={{
              '& .MuiInputBase-root': {
                fontSize: isMobile ? '0.875rem' : '1rem'
              },
              '& .MuiFormHelperText-root': {
                fontSize: isMobile ? '0.75rem' : '0.75rem'
              }
            }}
          />

          <TextField
            label="DeepL API Token"
            variant="outlined"
            fullWidth
            margin="normal"
            type="password"
            value={tokens.deepl}
            onChange={e => handleTokenChange('deepl', e.target.value)}
            placeholder="Enter your DeepL API token"
            size={isMobile ? 'small' : 'medium'}
            helperText={
              <>
                Get your token from{' '}
                <Link
                  href="https://www.deepl.com/en/your-account/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  DeepL Account
                </Link>
              </>
            }
            sx={{
              '& .MuiInputBase-root': {
                fontSize: isMobile ? '0.875rem' : '1rem'
              },
              '& .MuiFormHelperText-root': {
                fontSize: isMobile ? '0.75rem' : '0.75rem'
              }
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: isMobile ? 2 : 3, pb: isMobile ? 2 : 2, flexShrink: 0 }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          size={isMobile ? 'small' : 'medium'}
        >
          Cancel
        </Button>
        <Button
          onClick={saveTokens}
          variant="contained"
          disabled={loading}
          size={isMobile ? 'small' : 'medium'}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsModal;
