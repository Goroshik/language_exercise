'use client';

import {
  Autocomplete,
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
import { useDebounce } from 'src/hooks/useDebounce';

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

interface WordItem {
  id: string;
  word: string;
  translate: string;
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
  const [selectedWords, setSelectedWords] = useState<WordItem[]>([]);
  const [words, setWords] = useState<WordItem[]>([]);
  const [wordSearchInput, setWordSearchInput] = useState('');
  const [wordsLoading, setWordsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [languages, setLanguages] = useState<LanguageItem[]>([]);
  const [levels, setLevels] = useState<LevelItem[]>([]);

  // Debounce word search input
  const debouncedWordSearch = useDebounce(wordSearchInput, 300);

  // Получение языков
  const fetchLanguages = async () => {
    const res = await fetch('/api/languages');
    const data = await res.json();
    setLanguages(data.data || []);
  };

  // Получение уровней
  const fetchLevels = async () => {
    const res = await fetch('/api/levels');
    const data = await res.json();
    setLevels(data.data || []);
  };

  // Получение слов с поиском
  const fetchWords = async (query: string) => {
    setWordsLoading(true);
    const res = await fetch(`/api/dictionary/words?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    setWords(data.words || []);
    setWordsLoading(false);
  };

  // Получение истории
  const fetchHistory = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (languageId) params.append('languageId', languageId);
    if (level) params.append('level', level);
    if (selectedWords.length > 0)
      params.append('usedWordIds', selectedWords.map(w => w.id).join(','));
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

  // Fetch words when debounced search input changes
  useEffect(() => {
    if (debouncedWordSearch.length >= 2) {
      fetchWords(debouncedWordSearch);
    } else if (debouncedWordSearch.length === 0) {
      setWords([]);
    }
  }, [debouncedWordSearch]);

  // Получить текст и перевод слов по id
  const getWordsByIds = (ids: string[]) => {
    // First try to find in selected words
    const foundWords = selectedWords.filter(w => ids.includes(w.id));
    return foundWords;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        История сгенерированных предложений
      </Typography>
      <Stack spacing={2} sx={{ mb: 3 }}>
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
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <TextField
            select
            label="Язык"
            value={languageId}
            onChange={e => setLanguageId(e.target.value)}
            size="small"
            sx={{ minWidth: 150 }}
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
            sx={{ minWidth: 200 }}
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
          <Autocomplete
            multiple
            options={words}
            getOptionLabel={option => `${option.word} (${option.translate})`}
            value={selectedWords}
            onChange={(_, value) => setSelectedWords(value)}
            onInputChange={(_, value) => setWordSearchInput(value)}
            loading={wordsLoading}
            noOptionsText={
              wordSearchInput.length < 2 ? 'Введите минимум 2 символа' : 'Слова не найдены'
            }
            renderInput={params => (
              <TextField
                {...params}
                label="Слова"
                size="small"
                placeholder="Начните вводить слово..."
              />
            )}
            sx={{ minWidth: 300, flex: 1 }}
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
              <Box key={item.id} sx={{ p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                <Box sx={{ mb: 1 }}>
                  <LearnModeText text={item.sentence} />
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label={`Язык: ${item.language.nativeName}`} size="small" />
                  <Chip label={`Уровень: ${item.level}`} size="small" />
                  <Chip label={`Дата: ${new Date(item.createdAt).toLocaleString()}`} size="small" />
                  {getWordsByIds(item.usedWordIds).map(w => (
                    <Chip
                      key={w.id}
                      label={`${w.word} (${w.translate})`}
                      size="small"
                      color="primary"
                    />
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
