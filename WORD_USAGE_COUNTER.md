# Word Usage Counter Feature

## Overview

This feature automatically tracks how often each word from the user's dictionary is used in exercises. When a user submits their answers for checking, the system:

1. Extracts all words in their base forms from the submitted sentences
2. Matches these base forms with words in the user's dictionary
3. Increments usage counters for matched words

## Database Schema

### WordUsageStats Model

```prisma
model WordUsageStats {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  userId     String   @db.ObjectId
  wordId     String   @db.ObjectId
  count      Int      @default(0)
  lastUsedAt DateTime @default(now())
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  word Word @relation(fields: [wordId], references: [id], onDelete: Cascade)

  @@unique([userId, wordId])
  @@map("word_usage_stats")
}
```

**Fields:**
- `userId` - Reference to the user who owns the word
- `wordId` - Reference to the word in the dictionary
- `count` - Number of times the word has been used (default: 0)
- `lastUsedAt` - Timestamp of the last usage
- `createdAt` - When the stats record was created
- `updatedAt` - When the stats record was last updated

**Unique Constraint:** `(userId, wordId)` - Each word can only have one stats record per user

## How It Works

### 1. AI Prompt Enhancement

The `validateAnswers` prompt in `grammarPrompts.ts` has been updated to include a "WORDS:" section in the response format:

```
Response format:
- "CORRECT | WORDS: word1, word2, word3"
- "ERROR: [explanation] | WORDS: word1, word2, word3"
```

The AI returns all words from each sentence in their base forms:
- Verbs in infinitive form (e.g., "go" instead of "went")
- Nouns in nominative singular (e.g., "country" instead of "countries")
- Adjectives in base form

### 2. Word Extraction and Matching

In `checkAnswersService.ts`, the service:

1. **Extracts base words** from the AI response by parsing the "WORDS:" section
2. **Gets user's dictionary** filtered by their learning language
3. **Creates a word map** for case-insensitive matching (word.toLowerCase() -> wordId)
4. **Finds matches** between base words and dictionary words
5. **Increments counters** for all matched words

```typescript
// Extract words from AI response
allBaseWords.forEach(line => {
  if (line.includes('WORDS:')) {
    const words = line.split('WORDS:')[1]
      .split(',')
      .map(w => w.trim().toLowerCase());
    // ...
  }
});

// Match with dictionary and increment
await wordUsageStatsRepository.incrementUsageForWords(userId, matchedWordIds);
```

### 3. Usage Tracking

The `WordUsageStatsRepository` provides methods to:

- `incrementUsage(userId, wordId)` - Increment counter for a single word (upsert)
- `incrementUsageForWords(userId, wordIds)` - Batch increment for multiple words
- `getUsageStats(userId, wordId)` - Get stats for a specific word
- `getAllUsageStats(userId, orderByCount)` - Get all stats with optional ordering
- `getUsageCount(userId, wordId)` - Get just the count for a word

## API Endpoints

### GET /api/dictionary/word-usage-stats

**Query Parameters:**
- `wordId` (optional) - Get stats for a specific word
- `orderByCount` (optional) - Set to "true" to order by usage count (default: orders by last used)

**Response:**

For a specific word:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "userId": "...",
    "wordId": "...",
    "count": 5,
    "lastUsedAt": "2025-11-10T10:30:00Z",
    "createdAt": "2025-11-01T12:00:00Z",
    "updatedAt": "2025-11-10T10:30:00Z"
  }
}
```

For all words:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "userId": "...",
      "wordId": "...",
      "count": 10,
      "lastUsedAt": "2025-11-10T10:30:00Z",
      "word": {
        "id": "...",
        "word": "visit",
        "translate": "посещать",
        "languageCode": "en"
      }
    },
    // ...
  ]
}
```

## Error Handling

The word usage tracking is designed to be non-blocking:

- If tracking fails (e.g., database error), the error is logged but the main request continues
- The user's answer checking process is not affected by tracking failures
- This ensures that a tracking issue doesn't prevent users from getting their answers checked

```typescript
try {
  // Tracking logic
} catch (trackingErr) {
  console.error('Error tracking word usage:', trackingErr);
  // Continue with main flow
}
```

## Future Enhancements

Potential improvements to consider:

1. **UI Integration**: Display usage statistics in the dictionary view
2. **Analytics**: Show most/least used words, usage trends over time
3. **Gamification**: Badges or achievements for using diverse vocabulary
4. **Study Recommendations**: Suggest practicing words with low usage counts
5. **Language-specific improvements**: Better base form extraction for complex languages (Polish, Russian, etc.)

## Testing

To test the feature:

1. Ensure you have words in your dictionary
2. Submit answers for checking using the exercises feature
3. Check the usage stats via the API endpoint
4. Verify that counters increment when you use dictionary words in sentences

Example test flow:
```bash
# Add a word to dictionary
POST /api/dictionary/words
{ "word": "visit", "translate": "посещать", "languageCode": "en" }

# Submit an answer containing "visited"
POST /api/ai/check-answers
{ "topic": "Past Simple", "sentences": ["I visited Paris last year"] }

# Check usage stats
GET /api/dictionary/word-usage-stats?orderByCount=true

# Should show "visit" with count >= 1
```
