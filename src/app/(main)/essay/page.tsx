'use client';

import ClearIcon from '@mui/icons-material/Clear';
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSettingsStore } from 'src/store/settingsStore';
import { showAlert } from 'src/utils/alert';

interface Essay {
  id: string;
  title: string;
  content: string;
  aiResponse: string | null;
  languageCode: string;
  level: string | null;
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
  const [essays, setEssays] = useState<Essay[]>([]); // Store all essays
  const [essayTitles, setEssayTitles] = useState<string[]>([]);
  const [defaultTopics, setDefaultTopics] = useState<string[]>([]);
  const [hoveredErrorIndex, setHoveredErrorIndex] = useState<number | null>(null);
  const [selectedErrorIndex, setSelectedErrorIndex] = useState<number | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const languageCode = settings?.learningLanguage || 'en';

  // Word and character count
  const wordCount = content?.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content?.length || 0;

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
          setEssays(data.data); // Store all essays
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
  const loadEssayByTitle = useCallback((selectedTitle: string) => {
    if (!selectedTitle) return;
    
    try {
      const essay = essays.find((e: Essay) => e.title === selectedTitle);
      if (essay) {
        setCurrentEssayId(essay.id);
        setTitle(essay.title);
        setContent(essay.content);
        setSelectedErrorIndex(null); // Reset selected error when loading new essay
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
    } catch (error) {
      console.error('Failed to load essay:', error);
      showAlert.error('Не удалось загрузить сочинение');
    }
  }, [essays]);

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

    let essayIdToCheck = currentEssayId;

    // Save first if not saved
    if (!essayIdToCheck) {
      setSaving(true);
      try {
        const response = await fetch('/api/essays', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, languageCode })
        });
        const data = await response.json();
        if (data.success && data.data) {
          essayIdToCheck = data.data.id;
          setCurrentEssayId(data.data.id);
        } else {
          showAlert.error('Не удалось сохранить сочинение');
          return;
        }
      } catch (error) {
        console.error('Failed to save essay:', error);
        showAlert.error('Не удалось сохранить сочинение');
        return;
      } finally {
        setSaving(false);
      }
    }

    setLoading(true);
    setSelectedErrorIndex(null); // Reset selected error on new check
    try {
      const response = await fetch('/api/essays/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayId: essayIdToCheck,
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
    setSelectedErrorIndex(null);
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
        setSelectedErrorIndex(null);
      }
    }
  };

  // Combine default topics and user titles for autocomplete
  const allTopics = [...new Set([...defaultTopics, ...essayTitles])];

  // Render highlighted text with errors
  const renderHighlightedText = () => {
    if (!aiResponse || aiResponse.errors.length === 0) {
      return (
        <Typography sx={{ whiteSpace: 'pre-wrap', fontSize: '16px', lineHeight: 1.8 }}>
          {content}
        </Typography>
      );
    }

    // Create a map of error positions to avoid conflicts
    const errorPositions: Array<{ start: number; end: number; index: number }> = [];
    
    aiResponse.errors.forEach((error, index) => {
      let searchStart = 0;
      let errorIndex = content.indexOf(error.text, searchStart);
      
      // Find the first occurrence that doesn't overlap with existing errors
      while (errorIndex !== -1) {
        const errorEnd = errorIndex + error.text.length;
        const hasOverlap = errorPositions.some(
          pos => 
            (errorIndex >= pos.start && errorIndex < pos.end) || 
            (errorEnd > pos.start && errorEnd <= pos.end) ||
            (errorIndex <= pos.start && errorEnd >= pos.end)
        );
        
        if (!hasOverlap) {
          errorPositions.push({ start: errorIndex, end: errorEnd, index });
          break;
        }
        
        searchStart = errorIndex + 1;
        errorIndex = content.indexOf(error.text, searchStart);
      }
    });

    // Sort by position
    errorPositions.sort((a, b) => a.start - b.start);

    let lastIndex = 0;
    const elements: React.ReactNode[] = [];

    errorPositions.forEach(({ start, end, index }) => {
      // Add text before error
      if (start > lastIndex) {
        elements.push(
          <span key={`text-${index}`}>{content.substring(lastIndex, start)}</span>
        );
      }

      // Add highlighted error
      const isActive = hoveredErrorIndex === index || selectedErrorIndex === index;
      elements.push(
        <span
          key={`error-${index}`}
          style={{
            backgroundColor: aiResponse.errors[index].color,
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: '3px',
            borderBottom: isActive ? '2px solid rgba(0,0,0,0.5)' : '1px solid rgba(0,0,0,0.15)',
            fontWeight: isActive ? 'bold' : 'normal',
            transition: 'all 0.2s'
          }}
          onMouseEnter={() => setHoveredErrorIndex(index)}
          onMouseLeave={() => setHoveredErrorIndex(null)}
          onClick={() => setSelectedErrorIndex(selectedErrorIndex === index ? null : index)}
        >
          {content.substring(start, end)}
        </span>
      );

      lastIndex = end;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      elements.push(<span key="text-end">{content.substring(lastIndex)}</span>);
    }

    return (
      <Typography sx={{ whiteSpace: 'pre-wrap', fontSize: '16px', lineHeight: 1.8 }}>
        {elements}
      </Typography>
    );
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

      {/* Two column layout: Input and Highlighted Text */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Left: Input block */}
        <Box sx={{ flex: 1 }}>
          <TextField
            multiline
            rows={20}
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

        {/* Right: Highlighted Text */}
        <Box sx={{ flex: 1 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              minHeight: '400px',
              backgroundColor: '#fafafa',
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              '& .MuiTypography-root': {
                fontSize: '16px',
                lineHeight: 1.8
              }
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 'bold', color: 'text.secondary' }}>
              Текст с отмеченными ошибками:
            </Typography>
            {aiResponse && aiResponse.errors.length > 0 && (
              <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary', fontStyle: 'italic' }}>
                💡 Нажмите на ошибку для выделения
              </Typography>
            )}
            {aiResponse && aiResponse.errors.length > 0 ? (
              renderHighlightedText()
            ) : (
              <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                {content || 'Текст с отмеченными ошибками появится здесь после проверки'}
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Bottom section: Results */}
      {aiResponse && (
        <Box>
          {/* Level */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Результат проверки
            </Typography>
            <Typography variant="body1">
              <strong>Уровень:</strong> {aiResponse.level}
            </Typography>
          </Paper>

          {/* Errors List */}
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                mb: 2,
                fontWeight: 600
              }}
            >
              Найденные ошибки ({aiResponse.errors.length}):
            </Typography>
            {aiResponse.errors.length > 0 ? (
              <Box component="ul" sx={{ pl: 0, listStyle: 'none', m: 0 }}>
                {aiResponse.errors.map((error, index) => {
                  const isActive = hoveredErrorIndex === index || selectedErrorIndex === index;
                  return (
                    <Box
                      component="li"
                      key={index}
                      sx={{
                        mb: 2,
                        pb: 2,
                        borderBottom: index < aiResponse.errors.length - 1 ? '1px solid #e0e0e0' : 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        padding: '12px',
                        borderRadius: 1,
                        backgroundColor: isActive ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.02)'
                        },
                        fontWeight: isActive ? 'bold' : 'normal',
                        border: selectedErrorIndex === index ? '2px solid #1976d2' : '2px solid transparent'
                      }}
                      onMouseEnter={() => setHoveredErrorIndex(index)}
                      onMouseLeave={() => setHoveredErrorIndex(null)}
                      onClick={() => setSelectedErrorIndex(selectedErrorIndex === index ? null : index)}
                    >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: error.color,
                          mr: 2,
                          fontWeight: 'bold',
                          fontSize: '16px',
                          color: '#fff',
                          flexShrink: 0
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          sx={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            mb: 0.5,
                            color: 'text.primary'
                          }}
                        >
                          {error.text}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '15px',
                            lineHeight: 1.6,
                            color: 'text.secondary'
                          }}
                        >
                          {error.explanation}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
                })}
              </Box>
            ) : (
              <Typography variant="body2" color="success.main">
                Ошибок не найдено! 🎉
              </Typography>
            )}
          </Paper>

          {/* Summary */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              backgroundColor: '#f5f5f5',
              borderLeft: '4px solid #1976d2'
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 'bold',
                mb: 1,
                color: '#1976d2'
              }}
            >
              Общая оценка:
            </Typography>
            <Typography
              sx={{
                fontSize: '15px',
                lineHeight: 1.7,
                color: 'text.primary'
              }}
            >
              {aiResponse.summary}
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default EssayPage;
