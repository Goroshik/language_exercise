# Training from History Feature

## Overview

The "Training from History" feature allows users to practice with previously generated exercises instead of always generating new ones with AI. This is useful for:
- Reviewing previously studied material
- Practicing without consuming AI API credits
- Reinforcing learning with familiar content

## How It Works

### User Experience

1. **Navigate to a topic** (e.g., "Present Simple", "Past Continuous")
2. **Select level and mode** (A1-C2, Student/Teacher)
3. **See the "Train from History" button**:
   - If exercises exist: Button is enabled and shows count (e.g., "Training from History (15)")
   - If no exercises exist: Button is disabled

4. **Click the button** to load 5 random exercises from your history for that topic and level

### Button States

- **Enabled**: "Тренировка из истории (X)" where X is the number of available exercises
- **Disabled**: "Тренировка из истории" (grayed out)
- **Loading**: "Загружаем..." while fetching exercises

## Technical Implementation

### Database

Exercises are saved with a `topic` field in the `SentenceHistory` collection:

```typescript
model SentenceHistory {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  sentence    String
  languageId  String   @db.ObjectId
  level       String
  topic       String?  // Topic under which sentences were generated
  mode        String   @default("exercise")
  ownerId     String   @db.ObjectId
  // ... other fields
}
```

### API Endpoints

#### Check Availability
**POST** `/api/ai/check-history-availability`

Request:
```json
{
  "topic": "present simple",
  "languageId": "65f1a2b3c4d5e6f7g8h9i0j1",
  "level": "A1"
}
```

Response:
```json
{
  "success": true,
  "available": true,
  "count": 15
}
```

#### Fetch Training Exercises
**POST** `/api/ai/training-exercises`

Request:
```json
{
  "topic": "present simple",
  "languageId": "65f1a2b3c4d5e6f7g8h9i0j1",
  "level": "A1",
  "limit": 5
}
```

Response:
```json
{
  "success": true,
  "data": [
    "She **goes** to school every day.",
    "They **play** football on weekends.",
    // ... 3 more sentences
  ],
  "sentenceIds": ["id1", "id2", "id3", "id4", "id5"]
}
```

### Repository Methods

**SentenceHistoryRepository.ts**

```typescript
// Fetch random sentences by topic and level
async getRandomSentencesByTopicAndLevel({
  ownerId,
  topic,
  languageId,
  level,
  limit = 5
})

// Count available sentences
async countSentencesByTopicAndLevel({
  ownerId,
  topic,
  languageId,
  level
})
```

### Frontend Flow

1. **Page Load**: Check history availability
2. **User Changes Selection**: Re-check availability
3. **User Clicks Button**: Fetch random exercises
4. **Display**: Show exercises in same format as AI-generated ones

### Store Action

**appStore.ts**

```typescript
loadTrainingExercises: async ({
  languageId,
  level = 'A1',
  mode = 'student',
  limit = 5
})
```

## Key Features

1. **Random Selection**: Exercises are shuffled before being returned
2. **Smart Filtering**: Only fetches exercises matching:
   - Current topic
   - Selected level
   - Selected language
   - User's ID (only shows user's own exercises)

3. **Consistent Format**: Training exercises use the same format as newly generated ones:
   - Bold format: `**word**` for blanks
   - Compatible with existing validation system
   - Works with saved answers

4. **Topic Verification**: The topic field was already being saved in the `generateTextService`, so historical exercises are properly tagged

## Usage Example

### Scenario 1: First-time topic visit
```
User: Selects "Present Simple" topic, A1 level
System: Checks history → No exercises found
UI: "Train from History" button is disabled
User: Clicks "Create Exercises" → Generates with AI
System: Saves exercises with topic="present simple"
```

### Scenario 2: Returning to practiced topic
```
User: Selects "Present Simple" topic, A1 level
System: Checks history → 20 exercises found
UI: "Train from History (20)" button is enabled
User: Clicks "Train from History"
System: Fetches 5 random exercises from those 20
UI: Displays exercises for practice
```

## Benefits

1. **Cost Savings**: No AI API calls for training mode
2. **Faster Loading**: Database queries are faster than AI generation
3. **Spaced Repetition**: Users can review previously studied material
4. **Offline-ready**: Works even if AI service is unavailable

## Future Enhancements

Possible improvements for future versions:
- Configurable number of exercises (currently fixed at 5)
- Filter by date range (e.g., "exercises from last week")
- Smart selection algorithm (e.g., prioritize least-practiced exercises)
- "Mix" mode (combine new AI-generated + historical exercises)
