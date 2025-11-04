# TODO: Word Import Feature Improvements

This document contains planned improvements and known issues for the word import feature. Use these as prompts for AI agents or development tasks.

## Priority 1: Critical Issues

### 1.1 AI Response Format Inconsistency

**Status**: ⚠️ Needs Fix

**Issue**: The API route expects `data.data` but the service might return directly `data.words`:

```typescript
// ImportWordsModal.tsx line 104
if (data.success && data.data && data.data.length > 0) {
  const parsed: ParsedWord[] = data.data.map((item: any) => ({
```

But the API returns:

```typescript
// route.ts line 12
return NextResponse.json({ words });
```

**Expected Fix**: Standardize response format. Either:

- Option A: API returns `{ success: true, data: words }`
- Option B: Frontend expects `{ words }` directly

**Agent Prompt**:

> "Fix the inconsistency between the parse-words API response format and the ImportWordsModal expectations. The API returns `{ words }` but the frontend expects `{ success: true, data }`. Standardize to one format and update both files accordingly."

---

### 1.2 Fallback Manual Parsing Not Implemented

**Status**: ⚠️ Incomplete

**Issue**: ImportWordsModal.tsx line 115-118 mentions fallback manual parsing but doesn't implement it:

```typescript
} catch (error) {
  showAlert.error('Error parsing text with AI');
  // NOTE: Fallback manual parsing for demo
}
```

**Expected Behavior**: When AI parsing fails, attempt to parse the text manually using regex patterns:

- Pattern 1: `word - translation` (line by line)
- Pattern 2: `word : translation`
- Pattern 3: `word = translation`

**Agent Prompt**:

> "Implement fallback manual text parsing in ImportWordsModal when AI parsing fails. Support common patterns like 'word - translation', 'word : translation', and 'word = translation'. Parse line by line and return array of {word, translate} objects. Show appropriate alerts to user about using fallback method."

---

## Priority 2: Feature Enhancements

### 2.1 Add Bulk Edit Actions

**Status**: 💡 New Feature

**Description**: In the review step, add buttons for:

- "Auto-capitalize all words"
- "Remove duplicates"
- "Sort alphabetically"
- "Clear all"

**Agent Prompt**:

> "Add bulk editing actions to the ImportWordsModal review step. Include buttons for: auto-capitalize words, remove duplicates, sort alphabetically by word, and clear all. Place these buttons above the list of words. Ensure actions work on the parsedWords state array."

---

### 2.2 Support Multiple Language Pairs

**Status**: 💡 Enhancement

**Current**: System assumes English-Russian pairs
**Desired**: Support user-selected language pairs (EN-PL, EN-ES, etc.)

**Implementation Notes**:

- Add language selector to modal (source/target)
- Update AI prompts to use dynamic languages
- Store language pair metadata with words (optional)

**Agent Prompt**:

> "Extend word import to support multiple language pairs. Add language selectors (source and target) to ImportWordsModal. Update AI parsing prompts to use selected languages instead of hardcoded English-Russian. Consider storing language metadata with each word in the database."

---

### 2.3 Import from File

**Status**: 💡 New Feature

**Description**: Allow importing words from:

- CSV files (word, translation columns)
- TXT files (line-by-line format)
- JSON files (array of objects)

**Agent Prompt**:

> "Add file import capability to the word import modal. Support CSV (with word/translation columns), TXT (line-by-line), and JSON (array format) files. Add a file upload button in the input step. Parse file content and feed it to the existing parsing logic. Show file name and preview before parsing."

---

### 2.4 Duplicate Detection

**Status**: 💡 Enhancement

**Description**: Before saving, check if words already exist in user's dictionary:

- Highlight duplicates in review step
- Offer "Skip duplicates" or "Update existing" options
- Show count of new vs duplicate words

**Agent Prompt**:

> "Implement duplicate word detection in the word import flow. Before saving, query existing words for the user. Highlight duplicates in the review step with a warning badge. Add a checkbox option 'Skip duplicates' above the save button. Show statistics: X new words, Y duplicates."

---

### 2.5 Undo/Redo Support

**Status**: 💡 Enhancement

**Description**: Add undo/redo for edit actions in review step:

- Track edit history (word changes, deletions)
- Add undo/redo buttons in dialog toolbar
- Limit history to last 10 actions

**Agent Prompt**:

> "Add undo/redo functionality to the word import review step. Track changes to parsedWords array (edits, deletions) in a history stack. Add undo/redo buttons in the dialog title area. Limit history to last 10 actions. Use browser-style keyboard shortcuts (Ctrl+Z, Ctrl+Y)."

---

## Priority 3: User Experience

### 3.1 Improve Loading States

**Status**: 💡 Enhancement

**Description**: Add more informative loading states:

- Show parsing progress (e.g., "Found 5 words so far...")
- Display estimated time remaining
- Add cancel button for long operations

**Agent Prompt**:

> "Enhance loading states in ImportWordsModal during AI parsing. Show progressive updates like 'Parsing text...' → 'Found N words' → 'Processing translations...'. Add a cancel button to abort long-running AI requests. Consider using setTimeout to update progress messages every few seconds."

---

### 3.2 Add Keyboard Shortcuts

**Status**: 💡 Enhancement

**Shortcuts to Add**:

- `Ctrl+Enter` - Save/Import (in any step)
- `Escape` - Close modal
- `Tab` - Navigate between word/translation fields
- `Ctrl+D` - Delete current word in review

**Agent Prompt**:

> "Add keyboard shortcuts to ImportWordsModal. Implement: Ctrl+Enter to save/import, Escape to close, Tab for field navigation, and Ctrl+D to delete selected word in review. Add visual hints (tooltips or footer text) showing available shortcuts. Use event listeners on the dialog component."

---

### 3.3 Empty State Guidance

**Status**: 💡 Enhancement

**Description**: When textarea is empty, show helpful examples:

- Sample text formats
- "Try pasting from Google Translate"
- Quick start templates (e.g., "animals", "food", "verbs")

**Agent Prompt**:

> "Improve the empty state of the text input step in ImportWordsModal. When textarea is empty, show a helpful card with example formats, usage tips, and template buttons (e.g., 'Load animal words template'). Make examples copyable or clickable to auto-fill. Use MUI Box and Typography for styling."

---

### 3.4 Real-time Validation

**Status**: 💡 Enhancement

**Description**: In review step, validate fields in real-time:

- Warn if word is empty
- Warn if translation is empty
- Check for special characters
- Highlight very long words (potential typos)

**Agent Prompt**:

> "Add real-time validation to the word review step in ImportWordsModal. Show warning icons next to fields with issues (empty word, empty translation, excessive length). Use yellow badges for warnings. Add a 'Fix all issues' button that removes invalid entries. Don't block saving, just warn users."

---

## Priority 4: Performance & Scalability

### 4.1 Batch Size Limits

**Status**: 💡 Enhancement

**Issue**: No limit on number of words imported at once

**Solution**:

- Add max limit (e.g., 100 words per import)
- Show warning when approaching limit
- Offer to split into multiple batches automatically

**Agent Prompt**:

> "Add batch size limits to word import. Set maximum to 100 words per import. In review step, show warning if limit exceeded: 'Too many words (X/100). Only first 100 will be saved.' Optionally, add a 'Split into batches' button that allows saving in chunks with confirmation dialogs between batches."

---

### 4.2 Optimize API Calls

**Status**: 💡 Performance

**Current**: `createMany` is used but could be optimized with:

- Transaction support for rollback on partial failure
- Batch progress updates (for large imports)
- Background job for very large imports (>500 words)

**Agent Prompt**:

> "Optimize the word saving API for large batches. Wrap createMany in a Prisma transaction for atomic inserts. For batches >50 words, return a job ID and use polling to show progress. Add retry logic for network failures. Consider rate limiting on the API route."

---

### 4.3 Caching Parsed Results

**Status**: 💡 Performance

**Description**: Cache AI parsing results to avoid re-parsing same text:

- Use client-side sessionStorage
- Key by text content hash
- Clear on modal close or user logout

**Agent Prompt**:

> "Add client-side caching for AI-parsed results in ImportWordsModal. When user clicks 'Back' from review to input, cache the parsed words in sessionStorage (keyed by text hash). If same text is re-parsed, load from cache instantly. Clear cache when modal closes. Show a 'cached result' indicator."

---

## Priority 5: Testing & Documentation

### 5.1 Add Unit Tests

**Status**: ⚠️ Missing Tests

**Files Needing Tests**:

- `src/services/wordsService.ts`
- `src/services/parseWordsFromTextService.ts`
- `src/repository/WordRepository.ts`

**Agent Prompt**:

> "Create unit tests for word import services using Jest. Test wordsService.addManyWordService with valid/invalid inputs. Mock WordRepository methods. Test parseWordsFromTextService with different text formats. Aim for 80%+ code coverage on these three files."

---

### 5.2 Add E2E Tests

**Status**: ⚠️ Missing Tests

**Scenarios to Test**:

- Manual word addition flow (pre-filled modal)
- AI import with mock AI response
- Error handling (network failure, invalid JSON)
- Edit and delete words in review step

**Agent Prompt**:

> "Create end-to-end tests for word import using Playwright or Cypress. Test the complete flow: open modal, enter text, wait for parsing, review results, edit a word, delete a word, save. Mock the AI API response. Test error scenarios. Add to the project's existing E2E test suite."

---

### 5.3 API Documentation

**Status**: 💡 Enhancement

**Description**: Generate OpenAPI/Swagger docs for word import endpoints

**Agent Prompt**:

> "Create OpenAPI 3.0 specification for the word import API endpoints (/api/dictionary/words and /api/ai/parse-words). Include request/response schemas, error codes, authentication requirements. Generate from JSDoc comments if possible. Add Swagger UI page at /api/docs."

---

## Priority 6: Advanced Features

### 6.1 Smart Suggestions

**Status**: 💡 Advanced

**Description**: While user types in review step, offer suggestions:

- Similar words already in dictionary
- Common typo corrections
- Related word forms (plural, verb conjugations)

**Agent Prompt**:

> "Implement smart suggestions in the word review step. As user types in word/translation fields, query existing dictionary for similar words (Levenshtein distance). Show suggestions in a dropdown below the input. Use debouncing (300ms) to avoid excessive queries. Highlight potential duplicates in red, related words in blue."

---

### 6.2 Translation Quality Scoring

**Status**: 💡 Advanced

**Description**: Use AI to score translation quality:

- Accuracy (1-5 stars)
- Contextual appropriateness
- Common usage indicator

**Agent Prompt**:

> "Add translation quality scoring to parsed words. After AI parsing, send word pairs back to AI with prompt asking for quality score (1-5) and confidence level. Display stars or badges next to words in review step. Allow filtering by quality. Store scores in database for analytics."

---

### 6.3 Context-Aware Parsing

**Status**: 💡 Advanced

**Description**: Include context when parsing:

- Detect word usage category (noun, verb, adjective)
- Extract example sentences from input text
- Generate pronunciation guides

**Agent Prompt**:

> "Enhance AI parsing to extract context. Modify AI prompt to return: word, translation, part of speech, example sentence (from input text), and pronunciation. Update ParsedWord interface. Display additional fields in review step (collapsible). Make fields optional in database schema."

---

### 6.4 Voice Input

**Status**: 💡 Advanced

**Description**: Allow voice-to-text for word input:

- Add microphone button in input step
- Use Web Speech API
- Support multiple languages

**Agent Prompt**:

> "Add voice input support to ImportWordsModal. Add a microphone button next to the text area. Use the Web Speech API to convert speech to text. Detect language automatically or use user preference. Append voice input to existing text. Show recording indicator and stop button."

---

### 6.5 Collaborative Import

**Status**: 💡 Advanced

**Description**: Share import sessions with other users:

- Generate shareable link for parsed words
- Allow collaborators to edit before save
- Merge multiple user contributions

**Agent Prompt**:

> "Implement collaborative word import. After parsing, add a 'Share' button that generates a unique link. Store parsed words in temporary database table with expiry. Recipients can view/edit and vote on translations. Initiator can merge changes. Use WebSocket for real-time updates."

---

## Known Bugs

### Bug 1: Modal Z-Index Issue

**Severity**: Low  
**Description**: When translation panel is open and user opens import modal, z-index conflict causes overlap  
**Reproduction**: Select word → translation panel opens → click "Add to dictionary" → modal appears behind panel  
**Suggested Fix**: Close translation panel when opening import modal (already implemented) or increase modal z-index

### Bug 2: Special Characters Handling

**Severity**: Medium  
**Description**: AI parsing sometimes fails with special characters (smart quotes, em dashes)  
**Reproduction**: Import text with "apple" (curly quotes) or "book—книга" (em dash)  
**Suggested Fix**: Normalize text before sending to AI (replace smart quotes with straight quotes, em dashes with hyphens)

---

## Questions for Stakeholders

1. Should we support bidirectional translations (RU-EN as well as EN-RU)?
2. What's the maximum realistic batch size we expect users to import?
3. Do we need to track import history (when/how words were added)?
4. Should shared words be imported to personal dictionary or stay shared?
5. Is offline mode for word import a requirement?

---

## Related Documentation

- Main documentation: `WORDS_IMPORT.md`
- AI Copilot instructions: `.github/copilot-instructions.md`
- Alert system: `ALERT_SYSTEM.md`
- API architecture: See copilot-instructions.md section on "API Route Pattern"

---

## Contributing

When working on these tasks:

1. Read `WORDS_IMPORT.md` first to understand current implementation
2. Follow project conventions (Repository pattern, error handling with NextResponseError)
3. Use the alert system for user feedback (`showAlert.error/success`)
4. Add tests for new functionality
5. Update this TODO list when completing or adding tasks

### Pull Request Template for Word Import Changes

```markdown
## Changes

- [ ] Issue fixed or feature added (reference TODO item)
- [ ] Tests added/updated
- [ ] Documentation updated (WORDS_IMPORT.md)
- [ ] No regressions in existing flows

## Testing

- [ ] Manual addition flow tested
- [ ] AI import flow tested
- [ ] Error handling verified
- [ ] Multiple AI providers tested (if relevant)

## Notes

(Any additional context, breaking changes, or follow-up tasks)
```
