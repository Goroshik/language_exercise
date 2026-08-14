'use client';

import { Box } from '@mui/material';
import React, { useCallback, useEffect, useRef } from 'react';
import { essayService } from 'src/services/essayService';
import { useEssayStore } from 'src/store/essayStore';
import { useSettingsStore } from 'src/store/settingsStore';
import { showAlert } from 'src/utils/alert';
import { ErrorsList } from './ErrorsList';
import { EssayHeader } from './EssayHeader';
import { EssayInput } from './EssayInput';
import { EssayLevel } from './EssayLevel';
import { EssaySummary } from './EssaySummary';
import { HighlightedText } from './HighlightedText';

export const EssayContainer: React.FC = () => {
  const { settings } = useSettingsStore();
  const languageCode = settings?.learningLanguage || 'en';

  const {
    essays,
    currentEssayId,
    title,
    content,
    aiResponse,
    defaultTopics,
    loading,
    saving,
    hoveredErrorIndex,
    selectedErrorIndex,
    setEssays,
    setCurrentEssayId,
    setTitle,
    setContent,
    setAiResponse,
    setDefaultTopics,
    setLoading,
    setSaving,
    setHoveredErrorIndex,
    setSelectedErrorIndex,
    loadEssayByTitle,
    clearEssay
  } = useEssayStore();

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wordCount = content?.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content?.length || 0;

  const essayTitles = essays.map(e => e.title);
  const allTopics = [...new Set([...defaultTopics, ...essayTitles])];

  useEffect(() => {
    const loadDefaultTopics = async () => {
      try {
        const topics = await essayService.getDefaultTopics(languageCode);
        setDefaultTopics(topics);
      } catch (error) {
        console.error('Failed to load default topics:', error);
      }
    };
    void loadDefaultTopics();
  }, [languageCode, setDefaultTopics]);

  useEffect(() => {
    const loadEssays = async () => {
      try {
        const essaysData = await essayService.getEssays(languageCode);
        setEssays(essaysData);
      } catch (error) {
        console.error('Failed to load essays:', error);
      }
    };
    void loadEssays();
  }, [languageCode, currentEssayId, setEssays]);

  const saveEssay = useCallback(
    async (showSuccessAlert = true) => {
      if (!title.trim() || !content.trim()) {
        return;
      }

      setSaving(true);
      try {
        if (currentEssayId) {
          await essayService.updateEssay(currentEssayId, title, content);
          if (showSuccessAlert) {
            showAlert.success('Сочинение сохранено');
          }
        } else {
          const newEssay = await essayService.createEssay(title, content, languageCode);
          setCurrentEssayId(newEssay.id);
          if (showSuccessAlert) {
            showAlert.success('Сочинение создано');
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
    },
    [title, content, currentEssayId, languageCode, setSaving, setCurrentEssayId]
  );

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (!title.trim() || !content.trim()) {
      return;
    }

    saveTimeoutRef.current = setTimeout(() => {
      void saveEssay(false);
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content, saveEssay]);

  const handleCheck = useCallback(async () => {
    if (!content.trim()) {
      showAlert.warning('Пожалуйста, введите текст для проверки');
      return;
    }

    let essayIdToCheck = currentEssayId;

    if (!essayIdToCheck) {
      setSaving(true);
      try {
        const newEssay = await essayService.createEssay(title, content, languageCode);
        essayIdToCheck = newEssay.id;
        setCurrentEssayId(newEssay.id);
      } catch (error) {
        console.error('Failed to save essay:', error);
        showAlert.error('Не удалось сохранить сочинение');
        return;
      } finally {
        setSaving(false);
      }
    }

    setLoading(true);
    setSelectedErrorIndex(null);
    try {
      const result = await essayService.checkEssay(essayIdToCheck, content, languageCode);
      setAiResponse(result);
      showAlert.success('Проверка завершена');
    } catch (error) {
      console.error('Failed to check essay:', error);
      showAlert.error('Ошибка при проверке текста');
    } finally {
      setLoading(false);
    }
  }, [
    content,
    currentEssayId,
    title,
    languageCode,
    setSaving,
    setCurrentEssayId,
    setLoading,
    setSelectedErrorIndex,
    setAiResponse
  ]);

  const handleTitleChange = useCallback(
    (newValue: string | null) => {
      if (newValue) {
        setTitle(newValue);
        if (essayTitles.includes(newValue)) {
          loadEssayByTitle(newValue);
        } else {
          setCurrentEssayId(null);
          setContent('');
          setAiResponse(null);
          setSelectedErrorIndex(null);
        }
      }
    },
    [
      essayTitles,
      loadEssayByTitle,
      setTitle,
      setCurrentEssayId,
      setContent,
      setAiResponse,
      setSelectedErrorIndex
    ]
  );

  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
    },
    [setContent]
  );

  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', padding: 2 }}>
      <EssayHeader
        languageCode={languageCode}
        title={title}
        allTopics={allTopics}
        onTitleChange={handleTitleChange}
        onClear={clearEssay}
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <EssayInput
          content={content}
          wordCount={wordCount}
          charCount={charCount}
          saving={saving}
          loading={loading}
          onContentChange={handleContentChange}
          onCheck={handleCheck}
        />

        <Box sx={{ flex: 1 }}>
          <HighlightedText
            content={content}
            errors={aiResponse?.errors || null}
            hoveredErrorIndex={hoveredErrorIndex}
            selectedErrorIndex={selectedErrorIndex}
            onErrorHover={setHoveredErrorIndex}
            onErrorClick={setSelectedErrorIndex}
          />
        </Box>
      </Box>

      {aiResponse && (
        <Box>
          <EssayLevel level={aiResponse.level} />
          <ErrorsList
            errors={aiResponse.errors}
            hoveredErrorIndex={hoveredErrorIndex}
            selectedErrorIndex={selectedErrorIndex}
            onErrorHover={setHoveredErrorIndex}
            onErrorClick={setSelectedErrorIndex}
          />
          <EssaySummary summary={aiResponse.summary} />
        </Box>
      )}
    </Box>
  );
};
