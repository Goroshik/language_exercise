# Word List (Dictionary) Page Documentation

## Overview

The Dictionary page (`/dictionary`) is a central feature of the language learning application where users can manage their personal vocabulary. This page allows users to add, view, search, edit, and delete words with their translations.

## Location

- **Route**: `/dictionary`
- **Component**: `src/app/(main)/dictionary/page.tsx`
- **API Endpoint**: `src/app/api/dictionary/words/route.ts`
- **Repository**: `src/repository/WordRepository.ts`

## Features

### 1. Search Functionality

**User Experience:**
- Located at the top of the page below the action buttons
- Search field with a magnifying glass icon
- Placeholder text: "Поиск по слову или переводу..." (Search by word or translation...)
- Real-time search as you type
- Searches both the word and its translation

**Technical Implementation:**
```typescript
// Case-insensitive search query
const handleSearchChange = (query: string) => {
  setSearchQuery(query);
};

// API call with query parameter
const url = `/api/dictionary/words${searchQuery ? `?query=${encodeURIComponent(searchQuery)}` : ''}`;
```

**Backend Implementation:**
```typescript
// In WordRepository.ts
async searchWords(userId: string, query: string) {
  const where: any = {
    ownerId: userId
  };

  if (query) {
    where.OR = [
      { word: { contains: query, mode: 'insensitive' } },  // Case-insensitive
      { translate: { contains: query, mode: 'insensitive' } }
    ];
  }

  return this.client.findMany({ where, orderBy: { createdAt: 'desc' } });
}
```

**Key Points:**
- Search is **case-insensitive** using MongoDB's `mode: 'insensitive'`
- Searches both word and translation fields simultaneously (OR condition)
- Results update immediately as the user types
- Empty search returns all words
- Words are ordered by creation date (newest first)

### 2. Pagination

**User Experience:**
- 12 words displayed per page
- Pagination controls at the bottom of the word list
- Shows current page and total pages
- "First" and "Last" page buttons for quick navigation
- Page numbers for direct access

**Technical Implementation:**
```typescript
const WORDS_PER_PAGE = 12;

// Calculate pagination
const totalPages = Math.ceil(words.length / WORDS_PER_PAGE);
const startIndex = (currentPage - 1) * WORDS_PER_PAGE;
const endIndex = startIndex + WORDS_PER_PAGE;
const paginatedWords = words.slice(startIndex, endIndex);
```

**Key Points:**
- Client-side pagination (all filtered results are fetched, then sliced)
- Resets to page 1 when search query changes
- Pagination controls only show when there's more than 1 page
- Uses Material-UI Pagination component

### 3. Word Display

**Layout:**
- Cards displayed in a responsive grid
- 3 columns on desktop (33.333% width each)
- Automatic wrapping on smaller screens
- Minimum card width: 250px

**Word Card Features:**
- Word in the target language (prominent)
- Translation (secondary text)
- Edit button (pencil icon)
- Delete button (trash icon)
- Visual feedback on hover

### 4. Add Word

**User Experience:**
- "Добавить слово" (Add word) button in the top-right
- Opens a modal dialog
- Fields: Word, Translation
- Validation for required fields
- Success notification on add

**Technical Flow:**
1. User clicks "Добавить слово" button
2. Modal opens (`AddWordModal`)
3. User enters word and translation
4. On submit, POST request to `/api/dictionary/words`
5. Word is added to database with userId
6. List refreshes automatically
7. Modal closes

### 5. Import Words

**User Experience:**
- "Импорт слов" (Import words) button in the top-right
- Opens import modal
- Bulk import functionality
- Parses text with AI assistance

**Use Case:**
- Copy-paste a list of words from external sources
- AI extracts word-translation pairs
- Batch insert into database

### 6. Edit Word

**User Experience:**
- Click edit icon on word card
- Modal opens with pre-filled fields
- Modify word or translation
- Save changes

**API:** PUT `/api/dictionary/words/[id]`

### 7. Delete Word

**User Experience:**
- Click delete icon on word card
- Confirmation prompt (prevent accidental deletion)
- Word removed from list

**API:** DELETE `/api/dictionary/words/[id]`

## Data Flow

```
User Input (Search/Action)
    ↓
Dictionary Page Component
    ↓
API Route (/api/dictionary/words)
    ↓
WordRepository (searchWords, addWord, updateWord, deleteWord)
    ↓
Prisma Client (MongoDB)
    ↓
Response → Update UI
```

## API Endpoints

### GET `/api/dictionary/words`

**Query Parameters:**
- `query` (optional): Search string for filtering

**Response:**
```json
{
  "success": true,
  "words": [
    {
      "id": "...",
      "word": "hello",
      "translate": "привет",
      "ownerId": "...",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "shared": false
    }
  ]
}
```

### POST `/api/dictionary/words`

**Request Body:**
```json
{
  "words": [
    {
      "word": "hello",
      "translate": "привет"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "word": { /* created word object */ }
}
```

### PUT `/api/dictionary/words/[id]`

Updates a single word (word text or translation)

### DELETE `/api/dictionary/words/[id]`

Deletes a single word

## Database Schema

```prisma
model Word {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  word      String
  translate String
  ownerId   String   @db.ObjectId
  createdAt DateTime @default(now())
  shared    Boolean  @default(false)
}
```

## User Privacy

- All words are scoped to the logged-in user (`ownerId`)
- Users can only see, edit, and delete their own words
- Authentication enforced by `getUserIdFromRequest()` in API routes
- JWT token extracted from request headers by middleware

## Performance Considerations

1. **Search Performance:**
   - Uses MongoDB text search with indexes
   - Case-insensitive search may be slow on large datasets
   - Consider adding text indexes for better performance

2. **Pagination:**
   - Currently fetches all filtered words, then paginates client-side
   - For large word lists (>1000 words), consider server-side pagination
   - Trade-off: Simpler implementation vs. performance

3. **Real-time Updates:**
   - List reloads after every add/edit/delete operation
   - Uses optimistic UI patterns where possible

## Future Improvements

See `TODO.md` for planned enhancements including:
- Tags/categories for words
- Export functionality
- Advanced filtering
- Spaced repetition integration
- Word usage statistics
- Audio pronunciation

## Related Components

- **AddWordModal** (`src/app/(main)/dictionary/AddWordModal.tsx`): Modal for adding new words
- **WordCard** (`src/app/(main)/dictionary/WordCard.tsx`): Individual word display and actions
- **ImportWordsModal** (`src/components/ImportWordsModal.tsx`): Bulk import interface
- **WordSelector** (`src/app/(main)/exercises/[path]/WordSelector.tsx`): Word selection for exercises

## Testing

### Manual Testing Checklist

- [ ] Search with various queries (case-sensitive/insensitive)
- [ ] Search in word field only
- [ ] Search in translation field only
- [ ] Empty search returns all words
- [ ] Pagination works correctly
- [ ] Add word success
- [ ] Add word validation (empty fields)
- [ ] Edit word success
- [ ] Delete word with confirmation
- [ ] Import words functionality
- [ ] Responsive layout on mobile

### Edge Cases

- Empty dictionary (first-time user)
- Single word (no pagination)
- Exactly 12 words (one page)
- 13 words (two pages)
- Very long word/translation text
- Special characters in search
- Concurrent edits (handled by optimistic locking)

## Error Handling

- **Failed to load words**: Shows alert, sets empty array
- **Failed to add word**: Shows error alert, modal stays open
- **Failed to delete word**: Shows error alert, no state change
- **Network errors**: Graceful degradation with user feedback

## Accessibility

- Keyboard navigation support
- Screen reader friendly labels
- Focus management in modals
- ARIA labels on icon buttons
- Semantic HTML structure

## Internationalization

Currently in Russian (UI text), but designed for easy i18n:
- Word/translation fields support any Unicode characters
- UI strings can be extracted to translation files
- RTL language support may need CSS adjustments
