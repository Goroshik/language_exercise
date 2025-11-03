# Exercise History - AI Assistant Quick Reference

## Quick Overview

The Exercise History feature automatically saves all AI-generated sentences with metadata. Users can filter by text (case-insensitive), language, and level. No word filter exists - text search is sufficient.

## Critical Implementation Details

### Data Flow

```
AI Generation → Format & Parse → Save to DB → Display in History
```

### Sentence Format

**Generated**: `They **visited** many countries last summer. (visit)`  
**Stored**: `They **visited** many countries last summer.`  
**Display**: Blank/input field for `**visited**`

### Key Files

- **Schema**: `prisma/schema.prisma` - SentenceHistory model
- **Repository**: `src/repository/SentenceHistoryRepository.ts`
- **Service**: `src/services/generateTextService.ts` (saving logic)
- **Service**: `src/services/generatedHistoryService.ts` (retrieval logic)
- **API**: `src/app/api/ai/generated-history/route.ts`
- **UI**: `src/app/(main)/exercises/generated-history/page.tsx`
- **Prompts**: `src/prompts/grammarPrompts.ts`

## Code Patterns

### Saving Sentences After Generation

```typescript
// Location: src/services/generateTextService.ts (lines 94-134)

// 1. Extract bold words from sentences
const regex = /\*\*(.*?)\*\*/g;
const wordsInSentence = new Set<string>();
while ((match = regex.exec(sentence)) !== null) {
  const word = match[1].toLowerCase();
  if (wordMap.has(word)) {
    wordsInSentence.add(wordMap.get(word)!);
  }
}

// 2. Remove hints from sentence
const sentenceWithoutHints = sentence.replace(/\s*\([^)]+\)\s*$/, '').trim();

// 3. Prepare batch data
const sentencesToSave = result.map(sentence => ({
  ownerId: userId,
  sentence: sentenceWithoutHints,
  languageId,
  usedWordIds: Array.from(wordsInSentence),
  level,
  mode // 'student' or 'teacher'
}));

// 4. Batch insert
await sentenceHistoryRepository.addHistoryBatch(sentencesToSave);
```

### Retrieving with Filters

```typescript
// Location: src/services/generatedHistoryService.ts

export async function getGeneratedHistoryService(
  userId: string,
  filters: {
    languageId?: string;
    level?: string;
    usedWordIds?: string[];
    searchText?: string;
  }
) {
  return sentenceHistoryRepository.getHistory({
    ownerId: userId,
    ...filters
  });
}
```

### Repository Filter Implementation

```typescript
// Location: src/repository/SentenceHistoryRepository.ts (lines 57-89)

const where: Prisma.SentenceHistoryWhereInput = {
  ownerId
};

if (languageId) where.languageId = languageId;
if (level) where.level = level;
if (usedWordIds && usedWordIds.length > 0) {
  where.usedWordIds = { hasSome: usedWordIds };
}
if (searchText) {
  // IMPORTANT: Case-insensitive search
  where.sentence = { contains: searchText, mode: 'insensitive' };
}

return this.client.findMany({
  where,
  orderBy: { createdAt: 'desc' },
  include: {
    language: true // Include language details
  }
});
```

## API Endpoint Details

### GET /api/ai/generated-history

**Query Parameters**:

- `languageId`: String (optional) - Filter by language
- `level`: String (optional) - Filter by level (A1, A2, B1, B2, C1, C2)
- `usedWordIds`: String (optional) - Comma-separated word IDs
- `searchText`: String (optional) - Case-insensitive text search

**Example Request**:

```
GET /api/ai/generated-history?languageId=abc123&level=B1&searchText=visited
```

**Response Structure**:

```typescript
{
  success: boolean;
  data: Array<{
    id: string;
    sentence: string; // Without hints
    languageId: string;
    language: {
      id: string;
      code: string;
      name: string;
      nativeName: string;
    };
    usedWordIds: string[];
    level: string;
    mode: string; // 'student' or 'teacher'
    createdAt: string; // ISO timestamp
  }>;
}
```

## Database Schema

```prisma
model SentenceHistory {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  sentence    String   // Sentence without hints
  languageId  String   @db.ObjectId
  usedWordIds String[] @db.ObjectId  // Words used in generation
  level       String   // A1, A2, B1, B2, C1, C2
  mode        String   @default("exercise") // 'student' or 'teacher'
  ownerId     String   @db.ObjectId
  createdAt   DateTime @default(now())

  owner    User     @relation(...)
  language Language @relation(...)

  @@map("sentence_history")
}
```

## Prompt Format Requirements

### Student Mode (Exercise)

```typescript
GRAMMAR_PROMPTS.generateStudentExercises(topic, languageName, selectedWords);
```

- Generates **5 sentences**
- One word in **bold** (`**word**`)
- Hints in parentheses when appropriate: `(infinitive)`
- NO hints for articles or "to be"

### Teacher Mode (Learning)

```typescript
GRAMMAR_PROMPTS.generateTeacherExamples(topic, level, languageName, selectedWords);
```

- Generates **10 sentences**
- One word in **bold** (`**word**`)
- NO hints (for learning/viewing)

### Both Modes Follow Same Format

This ensures parsing and display logic is consistent.

## Important Constants

### Levels

```typescript
['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
```

### Modes

```typescript
'student' | 'teacher';
```

## Common Tasks

### Task: Add new filter type

1. Add parameter to `getHistory()` in `SentenceHistoryRepository.ts`
2. Add to `where` clause with appropriate MongoDB operator
3. Add query parameter parsing in `route.ts`
4. Add UI control in `page.tsx`
5. Update types in `generatedHistoryService.ts`

### Task: Modify sentence format

1. Update prompt in `grammarPrompts.ts`
2. Update parsing logic in `generateTextService.ts` (lines 100-116)
3. Update display logic in `LearnModeText.tsx` component
4. Test both student and teacher modes

### Task: Change saved data structure

1. Update `schema.prisma` model
2. Run `prisma generate`
3. Update repository methods
4. Update API response types
5. Update UI to handle new structure

## Testing Checklist

When working with exercise history:

- [ ] Verify sentences save after generation
- [ ] Check hints are removed before saving
- [ ] Test text search is case-insensitive
- [ ] Verify language filter works
- [ ] Verify level filter works
- [ ] Check word IDs are correctly extracted
- [ ] Test with no filters (should show all)
- [ ] Test with combined filters
- [ ] Verify sorting (newest first)
- [ ] Check language relation is included
- [ ] Test both student and teacher modes

## Common Pitfalls

1. **Don't forget to remove hints**: Stored sentences should not have hints
2. **Case-insensitive search**: Always use `mode: 'insensitive'` for text search
3. **Bold word extraction**: Must handle multiple spaces, special chars
4. **Word ID matching**: Case-insensitive comparison needed
5. **Batch operations**: Use `addHistoryBatch()` not multiple `addHistory()` calls
6. **Include relations**: Don't forget to include language details in queries
7. **Mode field**: Always specify 'student' or 'teacher' mode

## Performance Considerations

- **Batch inserts**: Always use batch when saving multiple sentences
- **Indexes**: Consider adding indexes on frequently filtered fields (languageId, level, ownerId)
- **Pagination**: Not yet implemented but UI is ready for it
- **Query optimization**: Include only needed relations

## Integration Points

### With AI Generation

- `processGenerateTextRequest()` in `generateTextService.ts`
- Saves automatically after successful generation
- Error handling: Fails gracefully if save errors (doesn't block generation response)

### With Dictionary

- Word IDs from user's dictionary
- Used to track which words were used in generation
- Enables future word-based filtering

### With Languages

- Language model relation for display
- Language name used in prompts
- Filterable by language

### With User Settings

- Level from user settings or request
- Owner ID from auth middleware
- Per-user history isolation

## Quick Debugging

### Sentences not appearing in history?

```typescript
// Check in generateTextService.ts around line 128
console.log('Sentences to save:', sentencesToSave);
console.log('Save result:', await sentenceHistoryRepository.addHistoryBatch(sentencesToSave));
```

### Filters not working?

```typescript
// Check in SentenceHistoryRepository.ts
console.log('Where clause:', JSON.stringify(where, null, 2));
```

### Word extraction failing?

```typescript
// Check in generateTextService.ts around line 104
console.log('Extracted words:', Array.from(wordsInSentence));
console.log('Word map:', Array.from(wordMap.entries()));
```
