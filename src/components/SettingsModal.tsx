'use client'

import React, {useState, useEffect} from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Box,
  Typography,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {SelectChangeEvent} from '@mui/material/Select';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  userId?: string;
}

interface UserToken {
  id: string;
  service: string;
  token: string;
  createdAt: string;
  updatedAt: string;
}

interface UserSettings {
  theme: string;
  aiModel: string;
  language: string;
  translationLang: string;
  customSettings: Record<string, any>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({open, onClose, userId = 'qwe'}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Token management state
  const [tokens, setTokens] = useState<Record<string, string>>({
    gemini: '',
    deepl: ''
  });

  // Settings state
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'light',
    aiModel: 'gemini-2.5-flash',
    language: 'en',
    translationLang: 'RU',
    customSettings: {}
  });

  // Available options
  const aiModels = [
    {value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash'},
    {value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro'},
    {value: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro'}
  ];

  const themes = [
    {value: 'light', label: 'Light'},
    {value: 'dark', label: 'Dark'}
  ];

  const languages = [
    {value: 'en', label: 'English'},
    {value: 'ru', label: 'Русский'}
  ];

  const translationLanguages = [
    {value: 'RU', label: 'Russian'},
    {value: 'EN', label: 'English'},
    {value: 'DE', label: 'German'},
    {value: 'FR', label: 'French'},
    {value: 'ES', label: 'Spanish'}
  ];

  // Load user data when modal opens
  useEffect(() => {
    if (open && userId) {
      loadUserTokens();
      loadUserSettings();
    }
  }, [open, userId]);

  const loadUserTokens = async () => {
    try {
      const response = await fetch(`/api/tokens?userId=${userId}`);
      if (response.ok) {
        const tokenData: UserToken[] = await response.json();
        const tokenMap: Record<string, string> = {};
        tokenData.forEach(token => {
          tokenMap[token.service] = token.token;
        });
        setTokens(prev => ({...prev, ...tokenMap}));
      }
    } catch (error) {
      console.error('Failed to load tokens:', error);
    }
  };

  const loadUserSettings = async () => {
    try {
      const response = await fetch(`/api/settings?userId=${userId}`);
      if (response.ok) {
        const settingsData = await response.json();
        setSettings(prev => ({...prev, ...settingsData}));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleTokenChange = (service: string, value: string) => {
    setTokens(prev => ({
      ...prev,
      [service]: value
    }));
  };

  const handleSettingChange = (field: keyof UserSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
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
              userId: 'qwe',
              service,
              token: token.trim()
            })
          });
        }
      }
      setSuccess('Tokens saved successfully!');
    } catch (error) {
      setError('Failed to save tokens');
      console.error('Save tokens error:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 'qwe',
          ...settings
        })
      });

      if (response.ok) {
        setSuccess('Settings saved successfully!');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      setError('Failed to save settings');
      console.error('Save settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (activeTab === 0) {
      saveTokens();
    } else {
      saveSettings();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>User Settings</DialogTitle>

      <DialogContent>
        <Box sx={{borderBottom: 1, borderColor: 'divider', mb: 2}}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="API Tokens"/>
            <Tab label="Preferences"/>
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{mb: 2}}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{mb: 2}}>
            {success}
          </Alert>
        )}

        {/* Tokens Tab */}
        {activeTab === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              API Tokens
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Enter your API tokens for different services. These will be encrypted and stored securely.
            </Typography>

            <TextField
              label="Gemini API Token"
              variant="outlined"
              fullWidth
              margin="normal"
              type="password"
              value={tokens.gemini}
              onChange={(e) => handleTokenChange('gemini', e.target.value)}
              placeholder="Enter your Gemini API token"
              helperText="Get your token from Google AI Studio"
            />

            <TextField
              label="DeepL API Token"
              variant="outlined"
              fullWidth
              margin="normal"
              type="password"
              value={tokens.deepl}
              onChange={(e) => handleTokenChange('deepl', e.target.value)}
              placeholder="Enter your DeepL API token"
              helperText="Get your token from DeepL API dashboard"
            />
          </Box>
        )}

        {/* Settings Tab */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              User Preferences
            </Typography>

            <FormControl fullWidth margin="normal">
              <InputLabel>Theme</InputLabel>
              <Select
                value={settings.theme}
                onChange={(e: SelectChangeEvent) => handleSettingChange('theme', e.target.value)}
              >
                {themes.map((theme) => (
                  <MenuItem key={theme.value} value={theme.value}>
                    {theme.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>AI Model</InputLabel>
              <Select
                value={settings.aiModel}
                onChange={(e: SelectChangeEvent) => handleSettingChange('aiModel', e.target.value)}
              >
                {aiModels.map((model) => (
                  <MenuItem key={model.value} value={model.value}>
                    {model.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Interface Language</InputLabel>
              <Select
                value={settings.language}
                onChange={(e: SelectChangeEvent) => handleSettingChange('language', e.target.value)}
              >
                {languages.map((lang) => (
                  <MenuItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Translation Target Language</InputLabel>
              <Select
                value={settings.translationLang}
                onChange={(e: SelectChangeEvent) => handleSettingChange('translationLang', e.target.value)}
              >
                {translationLanguages.map((lang) => (
                  <MenuItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20}/> : null}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsModal;
