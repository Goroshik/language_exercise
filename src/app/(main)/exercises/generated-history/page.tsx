'use client';

import {
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import LearnModeText from 'src/app/(main)/exercises/[path]/LearnModeText';

interface HistoryItem {
  id: string;
  sentence: string;
  languageId: string;
  language: {
    id: string;
    code: string;
    name: string;
    nativeName: string;
  };
  usedWordIds: string[];
  level: string;
  createdAt: string;
}

interface LanguageItem {
  id: string;
  code: string;
  name: string;
  nativeName: string;
}

interface LevelItem {
  value: string;
  label: string;
}

export default function GeneratedHistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [languageId, setLanguageId] = useState('');
  const [level, setLevel] = useState('');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [languages, setLanguages] = useState<LanguageItem[]>([]);
  const [levels, setLevels] = useState<LevelItem[]>([]);

  const fetchLanguages = async () => {
    const res = await fetch('/api/languages');
    const data = await res.json();
    setLanguages(data.data || []);
  };

  const fetchLevels = async () => {
    const res = await fetch('/api/levels');
    const data = await res.json();
    setLevels(data.data || []);
  };

  const fetchHistory = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (languageId) params.append('languageId', languageId);
    if (level) params.append('level', level);
    if (searchText) params.append('searchText', searchText);
    const res = await fetch(`/api/ai/generated-history?${params.toString()}`);
    const data = await res.json();
    setHistory(data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLanguages();
    fetchLevels();
    fetchHistory();
  }, []);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" sx={{ mb: 2, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
        История сгенерированных предложений
      </Typography>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Поиск по тексту"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          size="small"
          fullWidth
          placeholder="Введите текст для поиска в предложениях"
        />
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          sx={{ width: '100%' }}
        >
          <TextField
            select
            label="Язык"
            value={languageId}
            onChange={e => setLanguageId(e.target.value)}
            size="small"
            sx={{ flex: { xs: 1, sm: '0 1 200px' } }}
          >
            <MenuItem value="">
              <em>Все языки</em>
            </MenuItem>
            {languages.map(lang => (
              <MenuItem key={lang.id} value={lang.id}>
                {lang.nativeName}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Уровень"
            value={level}
            onChange={e => setLevel(e.target.value)}
            size="small"
            sx={{ flex: { xs: 1, sm: '0 1 250px' } }}
          >
            <MenuItem value="">
              <em>Все уровни</em>
            </MenuItem>
            {levels.map(lvl => (
              <MenuItem key={lvl.value} value={lvl.value}>
                {lvl.label}
              </MenuItem>
            ))}
          </TextField>
          <Button 
            variant="contained" 
            onClick={fetchHistory} 
            disabled={loading}
            sx={{ flex: { xs: 1, sm: '0 0 auto' } }}
          >
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
              <Box key={item.id} sx={{ p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                <Box sx={{ mb: 1 }}>
                  <LearnModeText text={item.sentence} />
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label={`Язык: ${item.language.nativeName}`} size="small" />
                  <Chip label={`Уровень: ${item.level}`} size="small" />
                  <Chip label={`Дата: ${new Date(item.createdAt).toLocaleString()}`} size="small" />
                </Stack>
              </Box>
            ))
          )}
        </Stack>
      )}
    </Box>
  );
}
