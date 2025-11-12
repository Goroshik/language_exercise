# Word Usage Counter - Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER SUBMITS ANSWERS                           │
│                                                                          │
│  POST /api/ai/check-answers                                             │
│  {                                                                       │
│    "topic": "Past Simple",                                              │
│    "sentences": ["I visited Paris", "She went to London"]               │
│  }                                                                       │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   checkAnswersService (Modified)                         │
│                                                                          │
│  1. Generate AI prompt with sentences                                   │
│  2. Call AI service with enhanced prompt                                │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        AI Service Response                               │
│                                                                          │
│  Returns formatted response with base forms:                            │
│  "1. CORRECT | WORDS: visit, paris                                      │
│   2. CORRECT | WORDS: go, to, london"                                   │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              Extract Base Words (NEW FUNCTIONALITY)                      │
│                                                                          │
│  Parse "WORDS:" section:                                                │
│  allBaseWords = ["visit", "paris", "go", "to", "london"]               │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              Match with User's Dictionary (NEW)                          │
│                                                                          │
│  1. Get user's words from WordRepository                                │
│  2. Filter by learning language (e.g., "en")                            │
│  3. Create map: word.toLowerCase() -> wordId                            │
│     {                                                                    │
│       "visit": "wordId123",                                             │
│       "paris": "wordId456",                                             │
│       "london": "wordId789"                                             │
│     }                                                                    │
│  4. Match base words: ["visit", "paris", "london"] found               │
│     matchedWordIds = ["wordId123", "wordId456", "wordId789"]           │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│           WordUsageStatsRepository.incrementUsageForWords()              │
│                                                                          │
│  For each wordId:                                                       │
│    - Check if stats record exists (userId + wordId)                     │
│    - If exists: count++, lastUsedAt = now()                             │
│    - If not: create new record with count=1                             │
│                                                                          │
│  Database Updates:                                                      │
│  WordUsageStats {                                                       │
│    userId: "user123",                                                   │
│    wordId: "wordId123",  // "visit"                                     │
│    count: 1 → 2,         // Incremented                                │
│    lastUsedAt: "2025-11-10T11:30:00Z"                                  │
│  }                                                                       │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   Return Check Results to User                           │
│                                                                          │
│  {                                                                       │
│    "success": true,                                                     │
│    "data": [                                                            │
│      { "isCorrect": true },                                             │
│      { "isCorrect": true }                                              │
│    ]                                                                     │
│  }                                                                       │
│                                                                          │
│  Note: Usage tracking happens in background, doesn't affect response    │
└─────────────────────────────────────────────────────────────────────────┘


═════════════════════════════════════════════════════════════════════════════
                         QUERYING USAGE STATISTICS
═════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────┐
│                  GET /api/dictionary/word-usage-stats                    │
│                                                                          │
│  Query all stats (ordered by lastUsedAt desc):                          │
│  GET /api/dictionary/word-usage-stats                                   │
│                                                                          │
│  Query specific word:                                                   │
│  GET /api/dictionary/word-usage-stats?wordId=wordId123                 │
│                                                                          │
│  Order by usage count:                                                  │
│  GET /api/dictionary/word-usage-stats?orderByCount=true                │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  WordUsageStatsRepository Query                          │
│                                                                          │
│  Returns usage statistics with word details:                            │
│  {                                                                       │
│    "success": true,                                                     │
│    "data": [                                                            │
│      {                                                                   │
│        "id": "statsId1",                                                │
│        "userId": "user123",                                             │
│        "wordId": "wordId123",                                           │
│        "count": 5,                                                      │
│        "lastUsedAt": "2025-11-10T11:30:00Z",                           │
│        "word": {                                                         │
│          "word": "visit",                                               │
│          "translate": "посещать",                                       │
│          "languageCode": "en"                                           │
│        }                                                                 │
│      }                                                                   │
│    ]                                                                     │
│  }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘


═════════════════════════════════════════════════════════════════════════════
                              KEY FEATURES
═════════════════════════════════════════════════════════════════════════════

✓ Automatic tracking - No manual intervention required
✓ Base form matching - Works with any grammatical form
✓ Case-insensitive - Matches "Visit", "visit", "VISIT"
✓ Language-aware - Only matches words in learning language
✓ Non-blocking - Tracking errors don't affect main flow
✓ Efficient - Batch processing for multiple words
✓ Timestamped - Tracks when word was last used
```
