# Word Selector Pattern Documentation

## Overview

The Word Selector is a reusable component pattern used throughout the application wherever users need to select words from their dictionary for exercise generation. It provides a consistent interface for searching, filtering, and selecting words.

## Location

- **Main Component**: `src/app/(main)/exercises/[path]/WordSelector.tsx`
- **Used In**: Exercise generation pages (e.g., `/exercises/[path]`)

## Design Philosophy

The Word Selector follows a specific UX pattern:

1. **Search-First Approach**: Users primarily interact through search rather than scrolling
2. **Limited Display**: Shows a subset of words initially to avoid overwhelming users
3. **Selected Words Persist**: Selected words remain visible even when filtered out by search
4. **Clear Limits**: Maximum selection count is visible and enforced
5. **Immediate Feedback**: Visual indication of selected state and disabled state

## Current Implementation

### Component Interface

```typescript
interface WordSelectorProps {
  selectedWords: DictionaryWord[]; // Currently selected words
  onWordsChange: (words: DictionaryWord[]) => void; // Callback when selection changes
  maxWords?: number; // Maximum words that can be selected (default: 5)
}
```

### Features

#### 1. Search Functionality

**User Experience:**

- Search input at the top of the selector
- Placeholder: "Поиск слов..." (Search words...)
- Real-time filtering as user types
- Searches both word and translation fields
- **Case-insensitive matching**

**Implementation:**

```typescript
const getFilteredWords = (searchQuery: string = '') => {
  return words.filter(word => {
    const matchesSearch =
      searchQuery === '' ||
      word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.translate.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });
};
```

#### 2. Word Selection

**User Experience:**

- Checkbox next to each word
- Click anywhere on the word row to toggle selection
- Selected words show checked checkbox
- Visual feedback on hover
- Disabled state when max limit reached

**Selection Logic:**

```typescript
const handleWordToggle = (word: DictionaryWord) => {
  const currentIndex = selectedWords.indexOf(word);
  const newSelectedWords = [...selectedWords];

  if (currentIndex === -1) {
    // Add word if not selected and under limit
    if (selectedWords.length < maxWords) {
      newSelectedWords.push(word);
    }
  } else {
    // Remove word if already selected
    newSelectedWords.splice(currentIndex, 1);
  }

  onWordsChange(newSelectedWords);
};
```

#### 3. Selection Counter

- Shows current selection count vs. maximum
- Format: "Выберите слова (2/5)"
- Updates in real-time as words are selected/deselected

#### 4. Tag Filtering (Planned Feature)

The component has infrastructure for tag-based filtering:

- Tag chips would appear above search
- Click to filter by tag
- Multiple tags can be selected (AND/OR logic)
- "Clear filters" button when tags are active

**Current State:** Tag collection is present but no tags are assigned to words yet.

## Expected Behavior Pattern

### Standard Workflow

1. **Initial Load:**
   - Fetch all user's words from API
   - Display first N words (or search results)
   - Show selection counter (0/5)

2. **Searching:**
   - User types in search field
   - List filters to matching words
   - Selected words remain visible (FUTURE IMPROVEMENT)
   - Non-matching selected words should stay at top

3. **Selecting:**
   - User checks a word
   - Word is added to selection
   - Counter updates (1/5)
   - Checkbox shows checked state

4. **Reaching Limit:**
   - User selects 5th word (if max=5)
   - Unselected words become disabled
   - User must deselect before selecting others
   - Clear visual indication of disabled state

5. **Using Selected Words:**
   - Parent component (exercise page) receives selected words
   - Selected words are used for exercise generation
   - Words remain selected across exercise batches

## Integration with Exercise Generation

### Exercise Page Integration

```typescript
// In exercise page component
const [selectedWords, setSelectedWords] = useState<DictionaryWord[]>([]);

// Word selector in sidebar
<WordSelector
  selectedWords={selectedWords}
  onWordsChange={setSelectedWords}
  maxWords={5}
/>

// Generate exercises button
<Button onClick={() => handleGenerate()}>
  Generate Exercises
</Button>

// Generate function uses selectedWords
const handleGenerate = () => {
  generateExercises({
    words: selectedWords,
    level: selectedLevel,
    mode: selectedMode,
    // ... other params
  });
};
```

### API Integration

Selected words are passed to exercise generation endpoints:

```typescript
// POST /api/ai/generate-sentences
{
  "words": [
    { "id": "...", "word": "hello", "translate": "привет" },
    { "id": "...", "word": "goodbye", "translate": "до свидания" }
  ],
  "level": "B1",
  "mode": "student",
  // ... other params
}
```

## Current Limitations & Future Improvements

### Known Issues

1. **Selected Words Don't Stay at Top**
   - When searching, selected words may be filtered out
   - Should keep selected words always visible at the top
   - Needs refactoring of filter logic

2. **No Initial Words Loaded**
   - Currently loads all words, which can be slow
   - Should load first 20-30 words by default
   - Additional words loaded through search

3. **No Tag Support**
   - Tag infrastructure exists but no UI for assigning tags
   - Would help organize large word lists

4. **Client-Side Filtering Only**
   - All words fetched from API at once
   - For users with 1000+ words, this may be slow
   - Consider server-side search for large lists

### Recommended Improvements

See `TODO.md` for detailed improvement plans.

## Word Selector Pattern: Best Practices

### When to Use

✅ **Use Word Selector when:**

- Generating exercises based on specific vocabulary
- User needs to choose from their personal dictionary
- Selection limit is needed (e.g., 5 words max)
- Search is the primary interaction method

❌ **Don't use when:**

- Displaying all words (use dictionary page instead)
- No selection needed (use read-only list)
- Selecting from pre-defined options (use dropdown)

### Customization Points

1. **Max Words**: Adjust based on exercise type
   - Grammar exercises: 5-10 words
   - Vocabulary drills: 20-30 words
   - Quick practice: 3-5 words

2. **Display Style**:
   - Compact: Checkbox + word only
   - Detailed: Include context, example sentences
   - Card-based: Visual representation

3. **Selection Mode**:
   - Single select (radio buttons)
   - Multi-select with limit (current)
   - Multi-select without limit

## Related Components

- **Dictionary Page**: Source of words, full CRUD operations
- **Exercise Pages**: Consumers of selected words
- **ImportWordsModal**: Bulk add words to dictionary
- **WordCard**: Display component in dictionary

## Data Flow

```
Dictionary Page (Add/Edit Words)
    ↓
API: /api/dictionary/words
    ↓
WordRepository (MongoDB)
    ↓
WordSelector (Fetch & Display)
    ↓
User Selection
    ↓
Exercise Generation (Use Selected Words)
```

## Technical Considerations

### Performance

- **Memoization**: Filter function should be memoized
- **Virtual Scrolling**: For 100+ words, use react-virtual
- **Debounced Search**: Add debounce to search input (300ms)
- **Lazy Loading**: Load words on scroll or search

### State Management

```typescript
// Local component state
const [filterText, setFilterText] = useState('');
const [words, setWords] = useState<DictionaryWord[]>([]);

// Props (from parent)
const { selectedWords, onWordsChange } = props;

// Computed state
const filteredWords = getFilteredWords(filterText);
```

### Accessibility

- Keyboard navigation (Tab, Space, Enter)
- Screen reader announcements for selection count
- ARIA labels for checkboxes
- Focus management after selection

## AI Assistant Guidelines

When working with the Word Selector:

1. **Preserve Selection State**: Never reset `selectedWords` unintentionally
2. **Respect Max Limit**: Enforce `maxWords` in all code paths
3. **Case-Insensitive Search**: Always use `.toLowerCase()` for string matching
4. **Clear Error Messages**: If limit reached, explain why selection failed
5. **Optimize Renders**: Use React.memo for word list items
6. **Test Edge Cases**: Empty dictionary, single word, max limit scenarios

## Example Usage Scenarios

### Scenario 1: Grammar Exercise Generation

```typescript
// User wants to practice past simple tense
// 1. Navigates to "Past Simple" topic
// 2. Opens word selector
// 3. Searches for verbs: "go", "eat", "run", "swim", "write"
// 4. Selects 5 verbs
// 5. Clicks "Generate Exercises"
// 6. AI creates sentences using those verbs in past simple
```

### Scenario 2: Targeted Vocabulary Practice

```typescript
// User learning business English
// 1. Previously tagged words with "business" tag
// 2. Filters by "business" tag
// 3. Selects 10 business-related words
// 4. Generates fill-in-the-blank exercises
// 5. Reviews and repeats difficult words
```

### Scenario 3: Quick Review

```typescript
// User has 5 minutes before meeting
// 1. Opens app
// 2. Selects 3 recent words from word selector
// 3. Generates quick quiz
// 4. Completes exercises
// 5. Gets immediate feedback
```

## Testing Guidelines

### Unit Tests (Recommended)

```typescript
describe('WordSelector', () => {
  it('should filter words by search query', () => {
    /* ... */
  });
  it('should enforce max word limit', () => {
    /* ... */
  });
  it('should toggle word selection', () => {
    /* ... */
  });
  it('should show correct selection count', () => {
    /* ... */
  });
  it('should disable unselected words at max limit', () => {
    /* ... */
  });
});
```

### Integration Tests

- Test with exercise generation flow
- Verify API calls with selected words
- Check state persistence across navigation

### Manual Testing

- [ ] Search with partial matches
- [ ] Select up to max limit
- [ ] Try to select beyond limit
- [ ] Deselect and reselect
- [ ] Clear search with selected words
- [ ] Navigate away and return
- [ ] Test on mobile (touch interactions)

## Conclusion

The Word Selector is a critical component for user engagement. A smooth, intuitive word selection experience directly impacts how often users create exercises and how much they learn.

**Key Success Metrics:**

- Time to select words < 10 seconds
- Search results accuracy > 95%
- User retention with word-based exercises > 70%

Focus future improvements on:

1. Keeping selected words visible (priority 1)
2. Smart word suggestions based on learning history
3. Quick-select presets (e.g., "Last 5 words", "Random 5")
