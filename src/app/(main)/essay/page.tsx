'use client';

import ClearIcon from '@mui/icons-material/Clear';
import {
  Autocomplete,
  Box,
  Button,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  CircularProgress,
  Paper
} from '@mui/material';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSettingsStore } from 'src/store/settingsStore';
import { showAlert } from 'src/utils/alert';

interface Essay {
  id: string;
  title: string;
  content: string;
  aiResponse?: string;
  languageCode: string;
  level?: string;
  updatedAt: string;
}

interface EssayError {
  text: string;
  explanation: string;
  color: string;
  type: string;
}

interface EssayCheckResponse {
  level: string;
  errors: EssayError[];
  summary: string;
}

const EssayPage: React.FC = () => {
  const { settings } = useSettingsStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [aiResponse, setAiResponse] = useState<EssayCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentEssayId, setCurrentEssayId] = useState<string | null>(null);
  const [essayTitles, setEssayTitles] = useState<string[]>([]);
  const [defaultTopics, setDefaultTopics] = useState<string[]>([]);
  const [hoveredErrorIndex, setHoveredErrorIndex] = useState<number | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const languageCode = settings?.learningLanguage || 'en';

  // Word and character count
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  // Load default topics
  useEffect(() => {
    const loadDefaultTopics = async () => {
      try {
        const response = await fetch(`/api/essays/default-topics?languageCode=${languageCode}`);
        const data = await response.json();
        if (data.success) {
          setDefaultTopics(data.data);
        }
      } catch (error) {
        console.error('Failed to load default topics:', error);
      }
    };
    loadDefaultTopics();
  }, [languageCode]);

  // Load user's essay titles
  useEffect(() => {
    const loadEssayTitles = async () => {
      try {
        const response = await fetch(`/api/essays?languageCode=${languageCode}`);
        const data = await response.json();
        if (data.success) {
          const titles = data.data.map((essay: Essay) => essay.title);
          setEssayTitles(titles);
        }
      } catch (error) {
        console.error('Failed to load essay titles:', error);
      }
    };
    loadEssayTitles();
  }, [languageCode, currentEssayId]); // Reload when essay is saved

  // Load essay when title is selected
  const loadEssayByTitle = useCallback(async (selectedTitle: string) => {
    if (!selectedTitle) return;
    
    try {
      const response = await fetch(`/api/essays?languageCode=${languageCode}`);
      const data = await response.json();
      if (data.success) {
        const essay = data.data.find((e: Essay) => e.title === selectedTitle);
        if (essay) {
          setCurrentEssayId(essay.id);
          setTitle(essay.title);
          setContent(essay.content);
          if (essay.aiResponse) {
            try {
              setAiResponse(JSON.parse(essay.aiResponse));
            } catch {
              setAiResponse(null);
            }
          } else {
            setAiResponse(null);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load essay:', error);
      showAlert.error('Не удалось загрузить сочинение');
    }
  }, [languageCode]);

  const saveEssay = useCallback(async (showSuccessAlert = true) => {
    if (!title.trim() || !content.trim()) {
      return;
    }

    setSaving(true);
    try {
      if (currentEssayId) {
        // Update existing essay
        const response = await fetch(`/api/essays/${currentEssayId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content })
        });
        const data = await response.json();
        if (data.success && showSuccessAlert) {
          showAlert.success('Сочинение сохранено');
        }
      } else {
        // Create new essay
        const response = await fetch('/api/essays', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, languageCode })
        });
        const data = await response.json();
        if (data.success) {
          setCurrentEssayId(data.data.id);
          if (showSuccessAlert) {
            showAlert.success('Сочинение создано');
          }
        }
      }
    } catch (error) {
      console.error('Failed to save essay:', error);
      if (showSuccessAlert) {
        showAlert.error('Не удалось сохранить сочинение');
      }
    } finally {
      setSaving(false);
    }
  }, [title, content, currentEssayId, languageCode]);

  // Auto-save functionality
  useEffect(() => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Don't save if title or content is empty
    if (!title.trim() || !content.trim()) {
      return;
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      saveEssay(false); // false = don't show success alert for auto-save
    }, 2000);

    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content, saveEssay]);

  const handleCheck = async () => {
    if (!content.trim()) {
      showAlert.warning('Пожалуйста, введите текст для проверки');
      return;
    }

    if (!currentEssayId) {
      await saveEssay(false); // Save first if not saved
      if (!currentEssayId) {
        showAlert.error('Не удалось сохранить сочинение');
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch('/api/essays/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayId: currentEssayId,
          content,
          languageCode
        })
      });

      const data = await response.json();
      if (data.success && data.data) {
        setAiResponse(data.data);
        showAlert.success('Проверка завершена');
      } else {
        showAlert.error(data.error || 'Не удалось проверить текст');
      }
    } catch (error) {
      console.error('Failed to check essay:', error);
      showAlert.error('Ошибка при проверке текста');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setContent('');
    setAiResponse(null);
  };

  const handleTitleChange = (newValue: string | null) => {
    if (newValue) {
      setTitle(newValue);
      // If it's an existing title, load the essay
      if (essayTitles.includes(newValue)) {
        loadEssayByTitle(newValue);
      } else {
        // New title - reset essay data
        setCurrentEssayId(null);
        setContent('');
        setAiResponse(null);
      }
    }
  };

  // Combine default topics and user titles for autocomplete
  const allTopics = [...new Set([...defaultTopics, ...essayTitles])];

  // Render highlighted text with errors
  const renderHighlightedText = () => {
    if (!aiResponse || aiResponse.errors.length === 0) {
      return <Typography sx={{ whiteSpace: 'pre-wrap' }}>{content}</Typography>;
    }

    let lastIndex = 0;
    const elements: React.ReactNode[] = [];

    aiResponse.errors.forEach((error, index) => {
      const errorIndex = content.indexOf(error.text, lastIndex);
      if (errorIndex !== -1) {
        // Add text before error
        if (errorIndex > lastIndex) {
          elements.push(
            <span key={`text-${index}`}>{content.substring(lastIndex, errorIndex)}</span>
          );
        }

        // Add highlighted error
        elements.push(
          <span
            key={`error-${index}`}
            style={{
              backgroundColor: error.color,
              cursor: 'pointer',
              borderBottom: hoveredErrorIndex === index ? '2px solid #000' : 'none',
              fontWeight: hoveredErrorIndex === index ? 'bold' : 'normal'
            }}
            onMouseEnter={() => setHoveredErrorIndex(index)}
            onMouseLeave={() => setHoveredErrorIndex(null)}
          >
            {error.text}
          </span>
        );

        lastIndex = errorIndex + error.text.length;
      }
    });

    // Add remaining text
    if (lastIndex < content.length) {
      elements.push(<span key="text-end">{content.substring(lastIndex)}</span>);
    }

    return <Typography sx={{ whiteSpace: 'pre-wrap' }}>{elements}</Typography>;
  };

  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        Написание текстов на {languageCode === 'en' ? 'английском' : 'польском'} языке
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        💾 Введенный текст сохраняется автоматически и будет доступен с любого устройства
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Autocomplete
          freeSolo
          options={allTopics}
          value={title}
          onChange={(_, newValue) => handleTitleChange(newValue)}
          onInputChange={(_, newValue) => setTitle(newValue)}
          renderInput={(params) => (
            <TextField {...params} label="Тема" placeholder="Выберите или введите тему" />
          )}
          sx={{ flex: 1 }}
        />
        <Tooltip title="Очистить поля для выбранной темы (старые данные будут перезаписаны при сохранении)">
          <IconButton onClick={handleClear} color="primary">
            <ClearIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Input block */}
        <Box sx={{ flex: 1 }}>
          <TextField
            multiline
            rows={15}
            fullWidth
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Введите ваш текст здесь..."
            sx={{ mb: 1 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Слов: {wordCount} | Символов: {charCount}
              {saving && <> • Сохранение...</>}
            </Typography>
            <Button
              variant="contained"
              onClick={handleCheck}
              disabled={loading || !content.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Проверяем...' : 'Проверить'}
            </Button>
          </Box>
        </Box>

        {/* Response block */}
        <Box sx={{ flex: 1 }}>
          {aiResponse ? (
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Результат проверки
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Уровень:</strong> {aiResponse.level}
              </Typography>
              
              <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                {renderHighlightedText()}
              </Box>

              <Typography variant="h6" gutterBottom>
                Ошибки:
              </Typography>
              {aiResponse.errors.length > 0 ? (
                <Box component="ul" sx={{ pl: 2 }}>
                  {aiResponse.errors.map((error, index) => (
                    <Box
                      component="li"
                      key={index}
                      sx={{
                        mb: 1,
                        cursor: 'pointer',
                        fontWeight: hoveredErrorIndex === index ? 'bold' : 'normal'
                      }}
                      onMouseEnter={() => setHoveredErrorIndex(index)}
                      onMouseLeave={() => setHoveredErrorIndex(null)}
                    >
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-block',
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          backgroundColor: error.color,
                          textAlign: 'center',
                          lineHeight: '24px',
                          mr: 1,
                          fontWeight: 'bold'
                        }}
                      >
                        {index + 1}
                      </Box>
                      {error.explanation}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="success.main">
                  Ошибок не найдено! 🎉
                </Typography>
              )}

              <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                {aiResponse.summary}
              </Typography>
            </Paper>
          ) : (
            <Paper
              sx={{
                p: 2,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f9f9f9'
              }}
            >
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Нажмите &quot;Проверить&quot;, чтобы получить обратную связь от AI
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default EssayPage;
