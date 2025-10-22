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
  Typography
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>API Tokens</DialogTitle>

      <DialogContent>
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
          <Typography variant="h6" gutterBottom>
            API Tokens
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
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
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={saveTokens}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsModal;
