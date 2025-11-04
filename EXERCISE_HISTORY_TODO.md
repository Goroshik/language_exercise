# Exercise History - Future Improvements TODO

This document contains AI-ready prompts for implementing future enhancements to the Exercise History feature. Each item is written as a prompt that can be given to an AI assistant to implement the feature.

## 1. Implement Pagination

**Priority**: High  
**Effort**: Medium  
**Impact**: Performance improvement for users with large history

### AI Prompt

```
Implement pagination for the Exercise History page (/exercises/generated-history).

Requirements:
1. Backend changes:
   - Add pagination parameters to GET /api/ai/generated-history endpoint
   - Accept `page` (number, default 1) and `perPage` (number, default 20, max 100) query parameters
   - Update SentenceHistoryRepository.getHistory() to accept skip and take parameters
   - Return total count along with paginated results
   - Response format: { success: true, data: [...], totalCount: number, page: number, perPage: number }

2. Frontend changes:
   - Add Material-UI Pagination component to generated-history/page.tsx
   - Add state for current page and items per page
   - Update fetchHistory() to include pagination params
   - Display total results count
   - Reset to page 1 when filters change
   - Maintain pagination state in URL query params for shareable links

3. Implementation notes:
   - Use MongoDB skip() and take() for pagination
   - Consider performance: large skip values may be slow
   - Add loading state during page transitions
   - Preserve scroll position or scroll to top on page change

Testing:
- Test with 0 results
- Test with results less than one page
- Test with multiple pages
- Test filter changes reset pagination
- Test URL parameters persist pagination state
```

## 2. Add Export Functionality

**Priority**: Medium  
**Effort**: Medium  
**Impact**: User convenience, data portability

### AI Prompt

```
Add export functionality to the Exercise History page to allow users to export their history to various formats.

Requirements:
1. Backend API endpoint:
   - Create POST /api/ai/generated-history/export
   - Accept same filters as GET endpoint
   - Accept format parameter: 'json', 'csv', 'txt'
   - Return appropriate file download response
   - Include all filtered results (not paginated)

2. Export formats:
   - JSON: Complete data structure with all fields
   - CSV: Sentence, Language, Level, Mode, Created Date, Word IDs (comma-separated)
   - TXT: Plain text format, one sentence per line with metadata

3. Frontend changes:
   - Add Export button to history page
   - Add dropdown menu for format selection (JSON/CSV/TXT)
   - Show loading state during export
   - Trigger browser download
   - Show success/error messages

4. Implementation details:
   - Use same filtering logic as main query
   - Set appropriate Content-Type headers
   - Set Content-Disposition header for filename
   - Include timestamp in filename: history_export_2025-01-15.csv
   - Respect current filters when exporting

Testing:
- Test each export format
- Test with filters applied
- Test with no results
- Test with large datasets
- Verify file encoding (UTF-8 for international characters)
```

## 3. Add Statistics Dashboard

**Priority**: Medium  
**Effort**: High  
**Impact**: User insights, motivation

### AI Prompt

```
Create a statistics dashboard for the Exercise History feature to show users insights about their learning progress.

Requirements:
1. Backend API endpoint:
   - Create GET /api/ai/generated-history/stats
   - Calculate and return:
     * Total sentences generated
     * Sentences by language (breakdown)
     * Sentences by level (breakdown)
     * Sentences by mode (student vs teacher)
     * Most used words (top 10)
     * Generation frequency over time (last 30 days)
     * Average sentences per session

2. Frontend component:
   - Create new page or section: /exercises/generated-history/stats
   - Use Material-UI Card components for stats display
   - Use charts for visualizations (consider recharts or nivo)
   - Bar chart: Sentences by language
   - Pie chart: Sentences by level
   - Line chart: Generation over time
   - Table: Most used words with count

3. Data aggregation:
   - Use MongoDB aggregation pipeline for efficient queries
   - Group by language, level, mode
   - Count occurrences of word IDs
   - Group by date for time series

4. UI features:
   - Add "View Statistics" button on history page
   - Add date range filter for stats
   - Make stats clickable to filter main history view
   - Add refresh button to update stats

Testing:
- Test with empty history
- Test with single language/level
- Test with diverse dataset
- Verify aggregation performance
- Test date range filtering
```

## 4. Implement Advanced Search

**Priority**: Low  
**Effort**: Medium  
**Impact**: Power user feature

### AI Prompt

```
Enhance the search functionality on the Exercise History page with advanced search capabilities.

Requirements:
1. Backend changes:
   - Extend GET /api/ai/generated-history to support:
     * Multiple search terms (AND/OR logic)
     * Exact phrase search (quoted strings)
     * Word exclusion (prefix with -)
     * Date range filtering (createdFrom, createdTo)
   - Parse search query string to extract operators
   - Build complex MongoDB query with $and, $or, $not

2. Frontend changes:
   - Add "Advanced Search" toggle/expandable section
   - Add date range picker (from/to)
   - Add search mode selector (Any words / All words / Exact phrase)
   - Add visual indicators for active advanced filters
   - Show search syntax help tooltip

3. Search syntax examples:
   - "visited countries" - exact phrase
   - visited countries - any of these words
   - visited -countries - visited but not countries
   - visited AND countries - both words required

4. Implementation details:
   - Parse search query on backend
   - Use regex for flexible matching
   - Maintain case-insensitive search
   - Validate date ranges
   - Show search syntax errors to user

Testing:
- Test each search operator
- Test combinations of operators
- Test with special characters
- Test invalid syntax handling
- Test date range edge cases
```

## 5. Add Favorites/Bookmarks

**Priority**: Low  
**Effort**: Medium  
**Impact**: User convenience

### AI Prompt

```
Add the ability for users to mark sentences as favorites/bookmarks in their Exercise History.

Requirements:
1. Database schema changes:
   - Add `isFavorite` boolean field to SentenceHistory model
   - Default value: false
   - Add index for efficient filtering

2. Backend API endpoints:
   - PATCH /api/ai/generated-history/:id/favorite
   - Body: { isFavorite: boolean }
   - Update sentence's favorite status
   - Return updated sentence

3. Update GET /api/ai/generated-history:
   - Add `favoritesOnly` query parameter (boolean)
   - Filter results to only favorites when true

4. Frontend changes:
   - Add star icon button to each sentence card
   - Toggle favorite on/off with click
   - Show filled star for favorites, outline for non-favorites
   - Add "Show Favorites Only" filter toggle
   - Add favorites count indicator
   - Optimistic UI update (update immediately, rollback on error)

5. Repository changes:
   - Add updateFavoriteStatus() method
   - Update getHistory() to support favorites filter

Testing:
- Test toggling favorite on/off
- Test favorites filter
- Test persistence across page reloads
- Test with no favorites
- Test optimistic updates
```

## 6. Add Sentence Duplication Check

**Priority**: Medium  
**Effort**: Low  
**Impact**: Data quality

### AI Prompt

```
Implement duplicate detection to prevent or flag duplicate sentences in the Exercise History.

Requirements:
1. Backend changes in generateTextService.ts:
   - Before saving, check for existing similar sentences
   - Use case-insensitive comparison
   - Consider removing punctuation for comparison
   - Options:
     a) Prevent duplicates: Don't save if exists
     b) Flag duplicates: Add isDuplicate field
     c) Show warning: Return duplicate info to user

2. Duplicate detection strategy:
   - Normalize sentences (lowercase, remove punctuation)
   - Check against user's existing history
   - Consider configurable similarity threshold (exact or fuzzy)

3. User notification:
   - If duplicates found, show message to user
   - Count how many duplicates were skipped
   - Option to view existing duplicate sentences

4. Repository changes:
   - Add findSimilarSentences() method
   - Accept normalized sentence text
   - Return matching sentences

Testing:
- Test exact duplicates
- Test case variations
- Test punctuation variations
- Test with no duplicates
- Test performance with large history
```

## 7. Add Bulk Actions

**Priority**: Low  
**Effort**: Medium  
**Impact**: User convenience

### AI Prompt

```
Add bulk action capabilities to the Exercise History page to allow users to perform actions on multiple sentences at once.

Requirements:
1. Backend API endpoint:
   - POST /api/ai/generated-history/bulk-action
   - Body: { action: 'delete' | 'favorite' | 'unfavorite', ids: string[] }
   - Perform action on all specified sentence IDs
   - Return success count and any errors

2. Frontend changes:
   - Add checkbox to each sentence card
   - Add "Select All" / "Deselect All" checkbox in header
   - Show action bar when items selected
   - Action buttons: Delete, Favorite, Unfavorite
   - Show selected count
   - Confirm dialog for destructive actions (delete)

3. Implementation details:
   - Use repository bulk methods where possible
   - Handle partial failures gracefully
   - Update UI optimistically
   - Show success/error notifications
   - Clear selection after action

4. Additional features:
   - Keyboard shortcuts (Ctrl+A for select all)
   - Select by filter (select all on current page, select all matching filters)
   - Bulk export selected sentences

Testing:
- Test each bulk action type
- Test with single selection
- Test with multiple selections
- Test select all functionality
- Test error handling (e.g., some IDs invalid)
- Test with pagination
```

## 8. Add Sentence Editing

**Priority**: Low  
**Effort**: High  
**Impact**: User flexibility

### AI Prompt

```
Allow users to edit saved sentences in their Exercise History.

Requirements:
1. Database schema changes:
   - Add `isEdited` boolean field to SentenceHistory
   - Add `originalSentence` string field (optional, stores original)
   - Add `editedAt` DateTime field

2. Backend API endpoint:
   - PATCH /api/ai/generated-history/:id
   - Body: { sentence: string }
   - Validate new sentence format (still has **bold** word)
   - Store original on first edit
   - Update sentence and set isEdited flag
   - Update editedAt timestamp

3. Frontend changes:
   - Add edit icon button to each sentence card
   - Open inline editor or modal dialog
   - Show current sentence with bold formatting preserved
   - Allow editing full sentence
   - Validate format before saving (must have **word**)
   - Show "edited" badge on edited sentences
   - Option to view original sentence

4. Validation:
   - Ensure sentence still contains at least one **word**
   - Preserve bold word format
   - Limit sentence length (e.g., 500 chars)

Testing:
- Test editing sentence
- Test invalid formats (no bold word)
- Test canceling edit
- Test viewing original
- Test isEdited flag
- Test permissions (can only edit own sentences)
```

## 9. Implement Smart Filtering

**Priority**: Low  
**Effort**: High  
**Impact**: Advanced user feature

### AI Prompt

```
Add intelligent filtering suggestions based on user's history and usage patterns.

Requirements:
1. Backend intelligence API:
   - Create GET /api/ai/generated-history/suggestions
   - Analyze user's generation patterns
   - Return suggested filters based on:
     * Most used languages
     * Most used levels
     * Most frequently generated topics
     * Recent activity patterns

2. Suggestion types:
   - "You often practice B1 level" → Quick filter button
   - "You haven't practiced A2 in a while" → Suggestion
   - "Your most used language is English" → Quick filter
   - "Recent focus: Past Simple tense" → Topic suggestion

3. Frontend changes:
   - Add "Suggestions" section above filters
   - Display as chips/buttons for quick access
   - One-click application of suggested filters
   - Dismissible suggestions
   - Track which suggestions are used

4. Data analysis:
   - Aggregate by language, level, words over last 30 days
   - Calculate frequencies and trends
   - Identify gaps in practice
   - Consider time since last generation

Testing:
- Test with limited history
- Test with diverse history
- Test with no recent activity
- Verify suggestion accuracy
- Test suggestion dismissal
```

## 10. Add Sharing Functionality

**Priority**: Low  
**Effort**: High  
**Impact**: Social/collaborative feature

### AI Prompt

```
Enable users to share selected sentences or entire exercise sets with others.

Requirements:
1. Database schema:
   - Create SharedSentenceSet model
   - Fields: id, creatorId, title, description, sentenceIds[], isPublic, shareToken, createdAt
   - Unique shareToken for URL sharing

2. Backend API endpoints:
   - POST /api/ai/generated-history/share
     * Body: { sentenceIds: string[], title: string, isPublic: boolean }
     * Create shared set with unique token
     * Return share URL
   - GET /api/ai/generated-history/shared/:token
     * Retrieve shared set by token
     * Return sentences with metadata
   - GET /api/ai/generated-history/shared
     * List public shared sets (browse/discover)

3. Frontend changes:
   - Add "Share" button (works with selection or filters)
   - Share dialog: title, description, public/private toggle
   - Generate shareable link
   - View shared sets page
   - Import shared sets to own history
   - Browse public shared sets

4. Security considerations:
   - Unique tokens for share URLs
   - Private sets only accessible via token
   - Public sets discoverable
   - Rate limit sharing actions
   - No sensitive data in shared sets

Testing:
- Test creating share
- Test accessing via token
- Test public vs private
- Test invalid tokens
- Test importing shared sets
- Test browsing public sets
```

## 11. Performance Optimization

**Priority**: Medium  
**Effort**: Medium  
**Impact**: Scalability

### AI Prompt

```
Optimize the Exercise History feature for better performance with large datasets.

Requirements:
1. Database optimizations:
   - Add indexes to SentenceHistory collection:
     * Compound index on (ownerId, createdAt)
     * Index on languageId
     * Index on level
     * Text index on sentence for better search
   - Monitor query performance with explain()

2. Backend optimizations:
   - Implement query result caching (Redis or in-memory)
   - Cache duration: 5 minutes
   - Invalidate cache on new sentence creation
   - Limit result set size (max 1000 per query)
   - Use projection to fetch only needed fields

3. Frontend optimizations:
   - Implement virtual scrolling for large lists
   - Use React.memo for sentence cards
   - Debounce filter changes (already has word search)
   - Lazy load language details
   - Client-side caching with React Query or SWR

4. Monitoring:
   - Add query performance logging
   - Track slow queries (>1 second)
   - Monitor database indexes usage
   - Track cache hit rates

Testing:
- Test with 1000+ sentences
- Test with 10000+ sentences
- Measure query response times
- Test concurrent users
- Verify cache invalidation
```

## 12. Add AI-Powered Insights

**Priority**: Low  
**Effort**: Very High  
**Impact**: Advanced learning feature

### AI Prompt

```
Use AI to analyze user's exercise history and provide personalized learning insights and recommendations.

Requirements:
1. Backend AI analysis service:
   - Create analyzeHistoryService.ts
   - Aggregate user's history data
   - Use AI to analyze:
     * Learning patterns and consistency
     * Strong vs weak grammar areas
     * Vocabulary growth
     * Difficulty progression
   - Generate personalized recommendations

2. API endpoint:
   - GET /api/ai/generated-history/insights
   - Run AI analysis on user's history
   - Return structured insights and recommendations

3. AI prompt for analysis:
   - Provide AI with summary of user's history:
     * Sentence count by level over time
     * Most practiced topics
     * Vocabulary usage patterns
   - Ask AI to identify:
     * Progress indicators
     * Areas needing attention
     * Recommended next topics
     * Learning pace assessment

4. Frontend display:
   - Create Insights page/section
   - Display AI-generated insights
   - Show recommendations as actionable items
   - Visualize progress trends
   - Link recommendations to exercise generation

5. Implementation considerations:
   - Rate limit analysis (expensive operation)
   - Cache results for 24 hours
   - Require minimum history size (e.g., 20 sentences)
   - Handle AI service errors gracefully

Testing:
- Test with minimal history
- Test with diverse history
- Test AI response parsing
- Verify recommendations quality
- Test caching behavior
```

---

## Implementation Priority Matrix

| Feature           | Priority | Effort    | Impact | Order |
| ----------------- | -------- | --------- | ------ | ----- |
| Pagination        | High     | Medium    | High   | 1     |
| Duplication Check | Medium   | Low       | Medium | 2     |
| Export            | Medium   | Medium    | Medium | 3     |
| Performance Opt.  | Medium   | Medium    | High   | 4     |
| Statistics        | Medium   | High      | Medium | 5     |
| Favorites         | Low      | Medium    | Medium | 6     |
| Advanced Search   | Low      | Medium    | Low    | 7     |
| Bulk Actions      | Low      | Medium    | Medium | 8     |
| Editing           | Low      | High      | Low    | 9     |
| Smart Filtering   | Low      | High      | Low    | 10    |
| Sharing           | Low      | High      | Low    | 11    |
| AI Insights       | Low      | Very High | Low    | 12    |

## Notes for AI Assistants

When implementing these features:

1. **Follow existing patterns**: Use the same repository/service/API structure
2. **Maintain consistency**: Match existing code style and TypeScript patterns
3. **Test thoroughly**: Each feature should be tested as described
4. **Update documentation**: Add new features to EXERCISE_HISTORY.md
5. **Consider security**: Validate inputs, check permissions, sanitize data
6. **Handle errors**: Proper error messages and graceful degradation
7. **Optimize queries**: Consider performance impact of new queries
8. **Maintain backwards compatibility**: Don't break existing functionality
