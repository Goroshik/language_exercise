# User Answer Persistence Implementation

## Overview

This document describes the implementation of user answer persistence for exercises in the language learning application.

## Requirements

- User answers must be saved to the database for each exercise sentence
- Only one answer per sentence per user (updates existing answer)
- Answers must persist when navigating between pages
- Answers should auto-save as the user types

## Architecture

### Database Schema

Added `UserAnswer` model to Prisma schema:

```prisma
model UserAnswer {
  id               String          @id @default(auto()) @map("_id") @db.ObjectId
  userId           String          @db.ObjectId
  sentenceId       String          @db.ObjectId
  answer           String
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  user             User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  sentence         SentenceHistory @relation(fields: [sentenceId], references: [id], onDelete: Cascade)

  @@unique([userId, sentenceId])
  @@map("user_answers")
}
```

**Key Features:**

- Unique constraint on `[userId, sentenceId]` ensures one answer per sentence per user
- Cascade delete: answers are deleted if user or sentence is deleted
- `updatedAt` field automatically tracks when answers are modified

### API Endpoints

#### POST /api/user-answers

Saves or updates a user's answer for a specific sentence.

**Request:**

```json
{
  "sentenceId": "507f1f77bcf86cd799439011",
  "answer": "I visited many countries last summer"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "507f191e810c19729de860ea",
    "userId": "507f1f77bcf86cd799439012",
    "sentenceId": "507f1f77bcf86cd799439011",
    "answer": "I visited many countries last summer",
    "createdAt": "2025-10-30T21:00:00.000Z",
    "updatedAt": "2025-10-30T21:00:00.000Z"
  }
}
```

#### GET /api/user-answers?sentenceIds=id1,id2,id3

Retrieves saved answers for multiple sentences.

**Request:**

```
GET /api/user-answers?sentenceIds=507f1f77bcf86cd799439011,507f1f77bcf86cd799439013
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "507f191e810c19729de860ea",
      "userId": "507f1f77bcf86cd799439012",
      "sentenceId": "507f1f77bcf86cd799439011",
      "answer": "I visited many countries last summer",
      "createdAt": "2025-10-30T21:00:00.000Z",
      "updatedAt": "2025-10-30T21:00:00.000Z"
    }
  ]
}
```

### Repository Layer

**UserAnswerRepository** (`src/repository/UserAnswerRepository.ts`):

- `saveAnswer()`: Upserts answer (creates or updates)
- `getAnswersBySentenceIds()`: Retrieves multiple answers by sentence IDs
- `getAnswer()`: Gets single answer by userId and sentenceId
- `deleteAnswer()`: Removes answer

### Service Layer

**generateTextService** (`src/services/generateTextService.ts`):

- Modified to return sentence IDs along with generated sentences
- Uses `addHistoryBatch()` which now returns created sentence objects with IDs
- Returns: `{ data: string[], sentenceIds: string[] }`

**ApiService** (`src/services/apiService.ts`):

- `saveUserAnswer(sentenceId, answer)`: Saves answer via API
- `getUserAnswers(sentenceIds)`: Retrieves answers via API
- `generateText()`: Updated return type to include sentenceIds

### State Management

**appStore** (`src/store/appStore.ts`):

- Added `savedAnswers` state: `{ [sentenceId: string]: string }`
- Added `loadSavedAnswers(sentenceIds)`: Fetches and stores answers from API
- Added `saveAnswer(sentenceId, answer)`: Saves answer to API and updates state
- Exposed globally via `window.__appStore` for non-hook components

### UI Components

#### TextWithInputs Component

**Key Changes:**

1. Accepts `sentenceId` prop
2. On mount: loads saved answer from global store
3. On change: debounces save to API (1 second delay)
4. Restores textarea value when sentenceId matches saved answer

**Implementation:**

```typescript
// Load saved answer on mount
useEffect(() => {
  if (typeof window !== 'undefined' && sentenceId) {
    const { savedAnswers } = (window as any).__appStore?.getState?.() || {};
    const savedAnswer = savedAnswers?.[sentenceId];
    if (savedAnswer) {
      setTextareaValue(savedAnswer);
    }
  }
}, [sentenceId]);

// Auto-save with debounce
const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
  const newValue = event.target.value;
  setTextareaValue(newValue);

  if (sentenceId && typeof window !== 'undefined') {
    const store = (window as any).__appStore;
    if (store?.getState) {
      const { saveAnswer } = store.getState();
      if (saveAnswer) {
        clearTimeout((handleTextareaChange as any).timeout);
        (handleTextareaChange as any).timeout = setTimeout(() => {
          saveAnswer(sentenceId, newValue);
        }, 1000);
      }
    }
  }
};
```

#### ExerciseBlock Component

**Key Changes:**

- Updated to pass `sentenceId` prop to `TextWithInputs`
- Added `sentenceId` to local Exercise interface

## Data Flow

### Exercise Generation Flow

1. User clicks "Создать упражнения"
2. `handleTopicSelect()` called in page component
3. API request to `/api/ai/generate-text`
4. `generateTextService`:
   - Generates sentences via AI
   - Saves sentences to `SentenceHistory` table
   - Returns sentences with their database IDs
5. Store creates exercise blocks with sentenceIds
6. Store calls `loadSavedAnswers(sentenceIds)` to fetch existing answers
7. Components render with loaded data

### Answer Saving Flow

1. User types in textarea
2. `handleTextareaChange()` triggered
3. After 1 second of no typing:
   - `saveAnswer(sentenceId, answer)` called from store
   - API POST to `/api/user-answers`
   - `UserAnswerRepository.saveAnswer()` upserts to database
   - Store updates `savedAnswers` state
4. Answer persisted successfully

### Answer Loading Flow

1. When exercises load with sentenceIds
2. Store calls `loadSavedAnswers(sentenceIds)`
3. API GET to `/api/user-answers?sentenceIds=...`
4. `UserAnswerRepository.getAnswersBySentenceIds()` queries database
5. Store updates `savedAnswers` state
6. Components read from global store on mount
7. TextWithInputs populates textarea with saved answer

## Benefits

1. **Persistence**: Answers survive page navigation and refresh
2. **Auto-save**: No manual save button needed, saves as user types
3. **Performance**: Debounced saves prevent excessive API calls
4. **Data Integrity**: Unique constraint ensures one answer per sentence
5. **User Experience**: Seamless - users don't lose work when navigating

## Technical Decisions

### Why Debounce Auto-save?

- Prevents API call on every keystroke
- Balances between responsiveness and performance
- 1 second delay is short enough to feel instant but reduces API load

### Why Global Store Access?

- `TextWithInputs` is a presentational component
- Accessing hooks would require restructuring component hierarchy
- Global access keeps component simple and focused

### Why Upsert Pattern?

- Allows same code path for create and update
- Prevents errors if answer already exists
- Ensures data consistency with unique constraint

### Why Promise.all Instead of createMany?

- MongoDB's `createMany` doesn't return created document IDs
- Need IDs to map back to sentences
- `Promise.all` with individual creates is acceptable for batch sizes < 20

## Testing Considerations

When testing this feature:

1. Generate exercises and verify sentenceIds are present
2. Type answer and wait 1 second, check database for saved answer
3. Navigate away and back, verify answer is restored
4. Modify existing answer, verify it updates (doesn't duplicate)
5. Test with multiple exercises to verify correct mapping

## Future Enhancements

Potential improvements:

1. **Optimistic updates**: Update UI immediately before API confirms
2. **Offline support**: Queue saves when offline, sync when online
3. **Answer history**: Track revisions for learning analytics
4. **Conflict resolution**: Handle concurrent edits if multiple tabs open
5. **Batch save**: Send multiple answers in single API call
