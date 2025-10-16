'use client'

import React, {useEffect, useState} from 'react';
import {Box, Typography, TextField, Button, Stack, Chip, Autocomplete} from '@mui/material';
import LearnModeText from 'src/app/(main)/exercises/[path]/LearnModeText';

interface HistoryItem {
  id: string;
  sentence: string;
  language: string;
  usedWordIds: string[];
  level: string;
  createdAt: string;
}

interface WordItem {
  id: string;
  word: string;
  translate: string;
}

export default function GeneratedHistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [language, setLanguage] = useState('');
  const [level, setLevel] = useState('');
  const [selectedWords, setSelectedWords] = useState<WordItem[]>([]);
  const [words, setWords] = useState<WordItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);

  // Получение всех слов пользователя
  const fetchWords = async () => {
    const res = await fetch('/api/dictionary/words');
    const data = await res.json();
    setWords(data.data || []);
  };

  // Получение истории
  const fetchHistory = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (language) params.append('language', language);
    if (level) params.append('level', level);
    if (selectedWords.length > 0) params.append('usedWordIds', selectedWords.map(w => w.id).join(','));
    if (searchText) params.append('searchText', searchText);
    const res = await fetch(`/api/ai/generated-history?${params.toString()}`);
    const data = await res.json();
    setHistory(data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchWords();
    fetchHistory();
    // eslint-disable-next-line
  }, []);

  // Получить текст и перевод слов по id
  const getWordsByIds = (ids: string[]) => words.filter(w => ids.includes(w.id));

  return (
    <Box sx={{p: 3}}>
      <Typography variant="h5" sx={{mb: 2}}>
        История сгенерированных предложений
      </Typography>
      <Stack spacing={2} sx={{mb: 3}}>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Поиск по тексту"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            size="small"
            fullWidth
            placeholder="Введите текст для поиска в предложениях"
          />
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField label="Язык" value={language} onChange={e => setLanguage(e.target.value)} size="small"/>
          <TextField label="Уровень" value={level} onChange={e => setLevel(e.target.value)} size="small"/>
          <Autocomplete
            multiple
            options={words}
            getOptionLabel={option => `${option.word} (${option.translate})`}
            value={selectedWords}
            onChange={(_, value) => setSelectedWords(value)}
            renderInput={params => <TextField {...params} label="Слова" size="small"/>}
            sx={{minWidth: 250}}
          />
          <Button variant="contained" onClick={fetchHistory} disabled={loading}>
            Поиск
          </Button>
        </Stack>
      </Stack>
      {loading ? (
        <Typography>Загрузка...</Typography>
      ) : (
        <Stack spacing={2}>
          {history.length === 0 ? (
            <Typography color="text.secondary">Нет данных</Typography>
          ) : (
            history.map(item => (
              <Box key={item.id} sx={{p: 2, border: '1px solid #eee', borderRadius: 2}}>
                <Box sx={{mb: 1}}>
                  <LearnModeText text={item.sentence} />
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label={`Язык: ${item.language}`} size="small"/>
                  <Chip label={`Уровень: ${item.level}`} size="small"/>
                  <Chip label={`Дата: ${new Date(item.createdAt).toLocaleString()}`} size="small"/>
                  {getWordsByIds(item.usedWordIds).map(w => (
                    <Chip key={w.id} label={`${w.word} (${w.translate})`} size="small" color="primary"/>
                  ))}
                </Stack>
              </Box>
            ))
          )}
        </Stack>
      )}
    </Box>
  );
}
