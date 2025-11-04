# TODO: Word Management System Improvements

This file contains planned improvements and prompts for AI assistants and developers working on the word management and selection features.

## Priority 1: High Impact UX Improvements

### 1.1 Selected Words Always Visible in WordSelector

**Problem:** When using search in WordSelector, selected words disappear if they don't match the search query. This breaks the user's mental model and makes it hard to see what's already selected.

**Expected Behavior:**

- Selected words should always appear at the top of the list
- Search results should appear below selected words
- Visual separator between selected and search results
- Selected words should be clearly marked (different background color)

**Implementation Prompt:**

```
Modify the WordSelector component to:
1. Split filtered words into two groups: selected and unselected
2. Always render selected words first, regardless of search query
3. Add visual distinction (e.g., light blue background for selected section)
4. Add a divider between selected and search results
5. Keep current search filtering for unselected words
6. Maintain all existing functionality (max limit, toggle, etc.)

Files to modify:
- src/app/(main)/exercises/[path]/WordSelector.tsx

Test cases:
- Select 3 words, then search for a word that doesn't match any selected word
- Selected words should still be visible at top
- Search results show below
- Can deselect from top section
- Can select from bottom section (if under limit)
```

### 1.2 Initial Load Optimization

**Problem:** WordSelector loads all words at once, which can be slow for users with large dictionaries (500+ words).

**Expected Behavior:**

- Load first 20-30 words initially
- Search triggers API call with query parameter
- Infinite scroll or "Load more" for browsing
- Selected words always loaded (stored separately)

**Implementation Prompt:**

```
Optimize WordSelector loading:
1. Add initial load limit to API endpoint (query param: limit=30)
2. Store selectedWords separately from browsable words
3. Implement search debouncing (300ms)
4. When searching, fetch from API with query
5. Add "Load more" button at bottom (optional)
6. Show loading spinner during fetch

Files to modify:
- src/app/(main)/exercises/[path]/WordSelector.tsx
- src/app/api/dictionary/words/route.ts
- src/repository/WordRepository.ts

New API behavior:
GET /api/dictionary/words?limit=30&offset=0&query=hello
```

## Priority 2: Feature Enhancements

### 2.1 Tags/Categories for Words

**Problem:** Users can't organize words by topic, difficulty, or context.

**Expected Behavior:**

- Add tags field to Word model
- UI to add/remove tags when creating/editing words
- Tag filter in WordSelector and Dictionary page
- Predefined tags (Verbs, Nouns, Business, Travel, etc.)
- Custom tags support

**Implementation Prompt:**

```
Add tagging system:
1. Update Prisma schema: Add tags field (array of strings) to Word model
2. Run migration
3. Update AddWordModal to include tag input (autocomplete)
4. Add tag chips to WordCard
5. Add tag filter UI in WordSelector (clickable chips)
6. Add tag filter UI in Dictionary page
7. Update search to optionally filter by tags

Database schema change:
model Word {
  // ... existing fields
  tags String[] @default([])
}

UI changes:
- Tag autocomplete in add/edit modals
- Tag chips on word cards
- Tag filter section in WordSelector
```

### 2.2 Word Usage Statistics

**Problem:** Users don't know which words they've practiced recently or which need more review.

**Expected Behavior:**

- Track when word is used in exercises
- Show "last used" date on word card
- Filter by "least recently used"
- Show usage count
- Suggest words that haven't been practiced

**Implementation Prompt:**

```
Add usage tracking:
1. Create WordUsage model (or add fields to Word)
2. When generating exercises, log word usage
3. Update Word with lastUsed timestamp and usageCount
4. Display stats on WordCard (subtle badge or text)
5. Add filter: "Not used in last 7 days"
6. Add sort option: "Least used first"

Consider:
- Privacy: Usage data should be per-user
- Performance: Batch updates to avoid slow exercise generation
- Analytics: Aggregate stats for user dashboard
```

### 2.3 Smart Word Suggestions

**Problem:** Users spend time searching for words instead of getting intelligent suggestions.

**Expected Behavior:**

- "Recently added" quick select (last 10 words)
- "Least practiced" quick select
- "Random 5" button for variety
- "Related words" based on current selection (AI-powered)

**Implementation Prompt:**

```
Add quick-select presets to WordSelector:
1. Add preset buttons above search field
2. "Recent" button: Load last 10 added words
3. "Random" button: Select 5 random words
4. "Needs practice" button: Select words not used in 7+ days
5. "Clear selection" button
6. Optional: AI-powered "Related" button (uses embeddings)

UI design:
- Button row at top of WordSelector
- Small, pill-shaped buttons
- Icons for each preset
- Tooltip explaining what each does
```

### 2.4 Export/Import Improvements

**Problem:** Current import is AI-based but no export functionality. Users can't backup or share word lists.

**Expected Behavior:**

- Export words to CSV
- Export words to JSON
- Import from CSV (structured format)
- Share word list with other users
- Duplicate detection during import

**Implementation Prompt:**

```
Add export functionality:
1. Add "Export" button to Dictionary page
2. Export formats: CSV, JSON
3. CSV format: word,translation,tags,created_date
4. JSON format: Full word objects

Enhance import:
1. Support CSV format (not just text)
2. Detect and skip duplicates
3. Show preview before import (table view)
4. Allow tag assignment during import
5. Validation: Check for empty fields, long words

Files to add:
- src/utils/exportWords.ts
- src/utils/importWords.ts (enhance existing)
```

## Priority 3: Advanced Features

### 3.1 Spaced Repetition Integration

**Problem:** No systematic way to review words at optimal intervals.

**Expected Behavior:**

- Track word difficulty (user rating after exercises)
- Calculate next review date using SM-2 algorithm
- "Review due" section in Dictionary page
- Generate exercises from due words
- Adjust intervals based on performance

**Implementation Prompt:**

```
Implement spaced repetition:
1. Add fields to Word: difficulty (1-5), nextReview (Date), interval (days)
2. After exercise completion, ask user: "How well did you know this word?"
3. Update difficulty and calculate nextReview
4. Add /dictionary/review page for due words
5. Generate exercises prioritizing due words
6. Show review streak and statistics

Algorithm: Use SM-2 or simpler variant
- Easy = double interval
- Medium = same interval
- Hard = reset interval to 1 day

References:
- SM-2 algorithm: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
```

### 3.2 Audio Pronunciation

**Problem:** Users don't know how to pronounce words.

**Expected Behavior:**

- Play button on each word card
- TTS (text-to-speech) using Web Speech API or cloud service
- Support for multiple languages
- Slow playback option for learning

**Implementation Prompt:**

```
Add pronunciation feature:
1. Add speaker icon to WordCard
2. Implement using Web Speech API (browser TTS)
3. Or integrate Google TTS / Amazon Polly (requires API key)
4. Language detection based on user settings
5. Playback speed control (0.5x, 1x)
6. Cache audio for offline use (optional)

Code structure:
- src/services/pronunciationService.ts
- Use Web Speech API for free solution
- Fallback to cloud TTS if available

Web Speech API example:
const utterance = new SpeechSynthesisUtterance(word);
utterance.lang = 'en-US';
speechSynthesis.speak(utterance);
```

### 3.3 Context and Examples

**Problem:** Words shown in isolation without context.

**Expected Behavior:**

- Optional example sentence for each word
- AI-generated examples on demand
- Show word usage in previously generated exercises
- Link to external resources (dictionaries)

**Implementation Prompt:**

```
Add context to words:
1. Add optional "example" field to Word model
2. "Generate example" button in AddWordModal (uses AI)
3. Display example on WordCard (collapsed by default)
4. Show "Used in X exercises" count
5. Click to see actual sentences where word was used
6. Link to external dictionary (configurable in settings)

AI prompt for example:
"Generate a simple example sentence using the word '{word}'
at {level} proficiency level. Keep it under 15 words."
```

### 3.4 Collaborative Word Lists

**Problem:** Users can't share word lists with teachers or study partners.

**Expected Behavior:**

- Share word list via link
- Public/private word lists
- Subscribe to teacher's word list
- Import words from shared list
- Version control (track changes)

**Implementation Prompt:**

```
Add sharing feature:
1. Add "shared" field to Word (already exists but unused)
2. Create SharedList model with unique code
3. UI: "Share this list" button in Dictionary
4. Generate shareable link: /shared/ABC123
5. View shared list without account
6. "Import to my dictionary" button
7. Track who created shared list (attribution)

Database schema:
model SharedList {
  id String @id
  code String @unique
  name String
  creatorId String
  words Word[]
  isPublic Boolean
  createdAt DateTime
}
```

## Priority 4: Performance & Infrastructure

### 4.1 Server-Side Pagination

**Problem:** Fetching all words for pagination is inefficient.

**Expected Behavior:**

- API returns paginated results
- Cursor-based pagination for MongoDB
- Faster page loads
- Reduced memory usage

**Implementation Prompt:**

```
Implement server-side pagination:
1. Update API to accept: page, limit, cursor params
2. Update WordRepository.searchWords() to use skip/take
3. Return metadata: total count, hasMore, nextCursor
4. Update Dictionary page to request by page
5. Update WordSelector to use cursor-based loading

API response format:
{
  "success": true,
  "words": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 12,
    "hasMore": true
  }
}
```

### 4.2 Search Optimization

**Problem:** Case-insensitive contains search is slow on large datasets.

**Expected Behavior:**

- Text indexes on word and translate fields
- Full-text search support
- Fuzzy matching for typos
- Search autocomplete

**Implementation Prompt:**

```
Optimize search:
1. Add MongoDB text index on Word.word and Word.translate
2. Use $text and $search operators
3. Optional: Add Elasticsearch for advanced search
4. Implement search suggestions (autocomplete)
5. Add search analytics (track common queries)

Prisma index:
@@index([word, translate])
@@fulltext([word, translate])

MongoDB text index:
db.words.createIndex({ word: "text", translate: "text" })
```

### 4.3 Offline Support

**Problem:** App requires internet connection for all operations.

**Expected Behavior:**

- Cache words locally (IndexedDB)
- Offline browsing of dictionary
- Queue changes for sync when online
- PWA with offline capabilities

**Implementation Prompt:**

```
Add offline support:
1. Setup PWA (manifest, service worker)
2. Use Workbox for caching strategy
3. Store words in IndexedDB
4. Sync queue for offline changes
5. Conflict resolution for edits
6. "Offline mode" indicator in UI

Technologies:
- next-pwa for service worker
- Dexie.js for IndexedDB
- SWR or React Query for sync
```

## Priority 5: Analytics & Insights

### 5.1 Learning Dashboard

**Problem:** No overview of learning progress.

**Expected Behavior:**

- Total words learned
- Words practiced this week
- Streak counter
- Proficiency distribution
- Most practiced topics

**Implementation Prompt:**

```
Create dashboard page (/dashboard):
1. Aggregate statistics from word usage
2. Charts: Words over time, practice frequency
3. Badges/achievements for milestones
4. Calendar view of practice days
5. Goal setting (e.g., "Add 5 words per week")

Use charting library:
- Recharts or Chart.js
- Simple, colorful visualizations
- Mobile-responsive
```

### 5.2 Word Difficulty Analysis

**Problem:** Can't identify which words are hardest.

**Expected Behavior:**

- Track correct/incorrect usage in exercises
- Calculate difficulty score
- "Struggling with" section
- Recommendations for review

**Implementation Prompt:**

```
Add difficulty tracking:
1. Store exercise results linked to words
2. Calculate: correctRate = correct / (correct + incorrect)
3. Display difficulty badge on WordCard
4. Filter by difficulty in Dictionary
5. Prioritize difficult words in review

UI indicators:
- Easy: Green badge
- Medium: Yellow badge
- Hard: Red badge
- Not practiced: Gray
```

## Quick Wins (Can be done in < 1 hour)

- [ ] Add word count to Dictionary page header ("150 words")
- [ ] Add "Clear search" X button in search field
- [ ] Keyboard shortcut for search (Ctrl+F)
- [ ] Double-click word in WordSelector to select
- [ ] "Select all visible" checkbox
- [ ] Dark mode support for dictionary
- [ ] Toast notification animations
- [ ] Word card hover animations
- [ ] Confirmation before deleting multiple words
- [ ] Undo delete (short time window)

## Long-Term Vision

- **Mobile App**: React Native version with offline-first approach
- **Browser Extension**: Quick-add words while browsing
- **AI Tutor**: Conversational interface for practicing words
- **Gamification**: Points, levels, leaderboards
- **Social Features**: Study groups, shared progress
- **Integration**: Anki export, Quizlet sync
- **Voice Input**: Add words via speech recognition
- **Image Association**: Add images to words for visual learning

## Contributing Guidelines

When implementing any of these TODOs:

1. **Test thoroughly**: Add unit tests for new features
2. **Update documentation**: Keep WORD_LIST_DOCUMENTATION.md current
3. **Preserve existing behavior**: Don't break current functionality
4. **Follow patterns**: Use existing code patterns (repository, API structure)
5. **Accessibility**: Ensure keyboard and screen reader support
6. **Mobile-first**: Test on mobile viewports
7. **Performance**: Use React.memo, useMemo, useCallback where appropriate
8. **Error handling**: Graceful degradation with user feedback

## Questions for Product Owner

- Should tags be hierarchical (categories > subcategories)?
- What should happen to words when user deletes account?
- Should there be a global shared word database?
- Pricing model for premium features (export, AI examples)?
- GDPR compliance for word data?
- Multi-language dictionary (words in multiple languages)?
- Import from popular platforms (Anki, Quizlet)?

## AI Assistant Prompts

When an AI assistant picks up any of these TODOs, use this format:

```
I'm implementing [FEATURE NAME] from TODO.md

Context:
- Current behavior: [describe]
- Expected behavior: [describe]
- Files affected: [list]

Plan:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Testing approach:
- [Test case 1]
- [Test case 2]

Questions:
- [Any clarifications needed]
```

## References

- **Spaced Repetition**: https://en.wikipedia.org/wiki/Spaced_repetition
- **SM-2 Algorithm**: https://www.supermemo.com/
- **PWA Best Practices**: https://web.dev/progressive-web-apps/
- **IndexedDB**: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- **MongoDB Text Search**: https://www.mongodb.com/docs/manual/text-search/

---

**Last Updated**: 2024-10-23  
**Maintainer**: Development Team  
**Priority Review**: Quarterly
