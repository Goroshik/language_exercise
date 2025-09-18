import React, {useEffect, useState} from 'react';
import {Box, Chip, InputAdornment, Paper, TextField, Typography} from '@mui/material';
import {Clear as ClearIcon, Search as SearchIcon} from '@mui/icons-material';
import {useDictionaryStore} from '../../store/dictionaryStore';
import {useDebounce} from '../../hooks/useDebounce';

interface TagFilterProps {
  onSearchChange: (searchQuery: string) => void;
}

const TagFilter: React.FC<TagFilterProps> = ({ onSearchChange }) => {
  const {
    selectedTags,
    allTags,
    setSelectedTags,
    clearFilters
  } = useDictionaryStore();

  // Local state for immediate input updates
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  // Debounced value that will trigger search
  const debouncedSearchQuery = useDebounce(localSearchQuery, 300);

  // Update parent component when debounced value changes
  useEffect(() => {
    onSearchChange(debouncedSearchQuery);
  }, [debouncedSearchQuery, onSearchChange]);

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(event.target.value);
  };

  const handleClearSearch = () => {
    setLocalSearchQuery('');
  };

  const handleClearAllFilters = () => {
    setLocalSearchQuery('');
    clearFilters();
  };

  const hasActiveFilters = selectedTags.length > 0 || localSearchQuery.length > 0;

  return (
    <Paper elevation={1} sx={{p: 2, mb: 2}}>
      <Typography variant="h6" gutterBottom>
        Фильтры
      </Typography>

      {/* Поиск */}
      <TextField
        fullWidth
        placeholder="Поиск по словам или переводам..."
        value={localSearchQuery}
        onChange={handleSearchChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon/>
            </InputAdornment>
          ),
          endAdornment: localSearchQuery && (
            <InputAdornment position="end">
              <ClearIcon
                onClick={handleClearSearch}
                style={{cursor: 'pointer'}}
              />
            </InputAdornment>
          )
        }}
        sx={{mb: 2}}
      />

      {/* Теги */}
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle2">
            Теги ({selectedTags.length} выбрано)
          </Typography>
          {hasActiveFilters && (
            <Chip
              label="Очистить все"
              onClick={handleClearAllFilters}
              size="small"
              variant="outlined"
              color="secondary"
            />
          )}
        </Box>

        <Box display="flex" gap={1} flexWrap="wrap">
          {allTags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              onClick={() => handleTagClick(tag)}
              color={selectedTags.includes(tag) ? "primary" : "default"}
              variant={selectedTags.includes(tag) ? "filled" : "outlined"}
              clickable
            />
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default TagFilter;

