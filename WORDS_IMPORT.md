# Word Import Documentation

## Overview

This document describes the word import functionality in the Language Exercise application. The system supports two methods for adding words to the user's dictionary:

1. **Manual Addition** - Adding a single word with translation via a form
2. **AI-Powered Import** - Parsing text to extract multiple words using AI

Both methods ultimately use the same API endpoint for saving words to the database.

## Architecture

### Key Components

- **Frontend**: `ImportWordsModal` component (`src/components/ImportWordsModal.tsx`)
- **API Routes**:
  - `POST /api/dictionary/words` - Save words (single or multiple)
  - `POST /api/ai/parse-words` - Parse text to extract words
- **Services**:
  - `wordsService.ts` - Word operations (search, add many)
  - `parseWordsFromTextService.ts` - AI text parsing
- **Repository**: `WordRepository` - Database operations
- **AI Services**: Multi-provider support (Gemini, OpenAI, Claude)

## Manual Word Addition

### User Flow

1. User clicks "Add to dictionary" from the word translation panel
2. `ImportWordsModal` opens with pre-filled word and translation
3. Modal shows "review" step with single word entry
4. User can edit the word/translation or remove it
5. User clicks "Add N words" button
6. Request sent to `/api/dictionary/words`

### Implementation Details

**Frontend (ImportWordsModal.tsx)**:

```typescript
// Pre-filled word triggers review step
useEffect(() => {
  if (open && preFilledWord && preFilledTranslate) {
    const preFilledParsedWord: ParsedWord = {
      word: preFilledWord,
      translate: preFilledTranslate
    };
    setParsedWords([preFilledParsedWord]);
    setStep('review');
  }
}, [open, preFilledWord, preFilledTranslate]);

// Save words
const addWords = async (words: ParsedWord[]) => {
  const response = await fetch('/api/dictionary/words', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words })
  });
  // ... error handling
};
```

**API Endpoint (src/app/api/dictionary/words/route.ts)**:

```typescript
export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  const { words } = await safeJson(request);

  // Words is an array, even for single word
  if (!words.length) {
    return NextResponse.json(
      { success: false, error: 'Word and translate are required' },
      { status: 400 }
    );
  }

  const createdWord = await addManyWordService(userId, words);
  return NextResponse.json({ success: true, word: createdWord });
}
```

**Important Note**: Even when adding a single word manually, the request body contains an **array** with one element:

```json
{
  "words": [{ "word": "apple", "translate": "яблоко" }]
}
```

## AI-Powered Text Import

### User Flow

1. User opens import modal (without pre-filled data)
2. User enters text in the input area (e.g., "apple - яблоко\nbook - книга")
3. User clicks "Import" button
4. Modal transitions to "parsing" step (shows loading spinner)
5. Text is sent to AI service for parsing
6. AI returns structured array of word objects
7. Modal transitions to "review" step
8. User can review, edit, or remove parsed words
9. User clicks "Add N words" button
10. Request sent to `/api/dictionary/words` (same as manual flow)

### Implementation Details

**Step 1: Parse Text with AI**

Frontend calls `/api/ai/parse-words`:

```typescript
const handleParseText = async () => {
  setIsLoading(true);
  setStep('parsing');

  const response = await fetch('/api/ai/parse-words', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: inputText })
  });

  const data = await response.json();
  const parsed: ParsedWord[] = data.data.map((item: any) => ({
    word: item.word || '',
    translate: item.translate || ''
  }));

  setParsedWords(parsed);
  setStep('review');
};
```

**API Route (src/app/api/ai/parse-words/route.ts)**:

```typescript
export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  const { text } = await safeJson(request);

  // AI service handles the parsing
  const words = await parseWordsFromTextService(text, userId);

  return NextResponse.json({ words });
}
```

**Service Layer (parseWordsFromTextService.ts)**:

```typescript
export async function parseWordsFromTextService(text: string, userId: string) {
  if (!text || typeof text !== 'string') {
    throw new NextResponseError('Text parameter is required', 400);
  }

  // Factory pattern - selects AI service based on user settings
  const aiService = await AIFactory.getAIService(userId);
  return aiService.parseWordsFromText!(text, userId);
}
```

**AI Service Implementation (GoogleAIService example)**:

The AI service uses a prompt to extract words:

````typescript
async parseWordsFromText(text: string, userId: string): Promise<ParsedWord[]> {
  const token = await this.validateAndGetToken(userId);
  const genAI = new GoogleGenerativeAI(token);
  const model = genAI.getGenerativeModel({ model: modelName });

  const prompt = `Parse the following text and extract English words or phrases with their Russian translations.
Return ONLY a valid JSON array with format: [{"word": "english_word", "translate": "russian_translation"}].
Do not include any other text, explanations, or formatting.
If a line contains both English and Russian, extract them as word-translation pairs.
If a line has only English, leave translate empty.
Skip empty lines and non-word content.

Text to parse:
${text}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  // Clean and parse JSON response
  const cleanedResponse = responseText.replace(/```json|```/g, '').trim();
  const parsedWords = JSON.parse(cleanedResponse);

  return parsedWords.filter(item => item.word && typeof item.word === 'string');
}
````

**Step 2: Review and Save**

After parsing, the user reviews the words in the modal. This is the same "review" step used in manual addition. When the user clicks save, the same API endpoint is called with the array of words.

### AI Provider Support

The system supports multiple AI providers through the Factory pattern:

- **Google Gemini** (`GoogleAIService`) - gemini-2.0-flash-exp, gemini-2.5-flash, etc.
- **OpenAI** (`OpenAIService`) - gpt-4, gpt-3.5-turbo, etc.
- **Anthropic Claude** (`ClaudeAIService`) - claude-3-opus, claude-3-sonnet, etc.

The AI provider is selected based on user settings (`aiModel` field in `UserSettings`).

## Data Flow Diagram

### Manual Addition

```
WordTranslationPanel
  └─> ImportWordsModal (pre-filled)
        └─> Review Step
              └─> POST /api/dictionary/words
                    └─> wordsService.addManyWordService()
                          └─> wordRepository.addManyWord()
                                └─> Database (createMany)
```

### AI Import

```
ImportWordsModal
  └─> Input Step (user enters text)
        └─> POST /api/ai/parse-words
              └─> parseWordsFromTextService()
                    └─> AIFactory.getAIService()
                          └─> AI Service (Gemini/OpenAI/Claude)
                                └─> Returns ParsedWord[]
  └─> Review Step (user edits)
        └─> POST /api/dictionary/words
              └─> wordsService.addManyWordService()
                    └─> wordRepository.addManyWord()
                          └─> Database (createMany)
```

## Database Schema

Words are stored in the `Word` model with the following key fields:

- `id` - Unique identifier (auto-generated)
- `word` - The word/phrase in the source language
- `translate` - Translation in the target language
- `ownerId` - User ID (links word to user)
- `shared` - Boolean flag (optional, for shared dictionaries)
- `createdAt` - Timestamp (auto-generated)

## Repository Layer

**WordRepository Methods**:

```typescript
// Add multiple words at once (used by both manual and import flows)
async addManyWord(
  userId: string,
  data: { word: string; translate: string; createdAt?: Date; shared?: boolean }[]
) {
  return this.client.createMany({
    data: data.map(word => ({ ...word, ownerId: userId }))
  });
}

// Search words (used in dictionary view)
async searchWords(userId: string, query: string) {
  const where: any = { ownerId: userId };
  if (query) {
    where.OR = [
      { word: { contains: query, mode: 'insensitive' } },
      { translate: { contains: query, mode: 'insensitive' } }
    ];
  }
  return this.client.findMany({ where, orderBy: { createdAt: 'desc' } });
}
```

## API Contract

### POST /api/dictionary/words

**Request Body**:

```json
{
  "words": [
    {
      "word": "apple",
      "translate": "яблоко"
    },
    {
      "word": "book",
      "translate": "книга"
    }
  ]
}
```

**Success Response** (200):

```json
{
  "success": true,
  "word": {
    /* created words result */
  }
}
```

**Error Response** (400):

```json
{
  "success": false,
  "error": "Word and translate are required"
}
```

### POST /api/ai/parse-words

**Request Body**:

```json
{
  "text": "apple - яблоко\nbook - книга\ncat - кот"
}
```

**Success Response** (200):

```json
{
  "words": [
    { "word": "apple", "translate": "яблоко" },
    { "word": "book", "translate": "книга" },
    { "word": "cat", "translate": "кот" }
  ]
}
```

**Error Response** (402 - No AI Token):

```json
{
  "error": "AI service token not configured for user"
}
```

**Error Response** (500):

```json
{
  "error": "Internal server error"
}
```

## Security

- **Authentication**: All endpoints require JWT authentication via middleware
- **User Isolation**: Words are always linked to the authenticated user (`ownerId`)
- **Token Encryption**: AI service tokens are encrypted at rest using AES-256-CBC
- **Input Validation**: Text input is validated before AI processing

## Error Handling

The modal handles various error scenarios:

1. **AI parsing failure**: Falls back to manual parsing (or shows error)
2. **Network errors**: Shows user-friendly error messages via alert system
3. **Empty results**: Prevents saving if no words are parsed
4. **Invalid tokens**: Returns 402 error if user hasn't configured AI tokens

## Testing Considerations

When testing this feature, consider:

1. **Manual addition**: Single word with pre-filled data
2. **Empty text**: Import button should be disabled
3. **AI parsing**: Various text formats (line-by-line, paragraphs, mixed)
4. **Review edits**: Modifying words before saving
5. **Removing words**: Deleting items from parsed list
6. **API errors**: Handle failures gracefully with alerts
7. **Multiple AI providers**: Test with different user AI model settings

## Future Improvements

See `TODO_WORDS.md` for planned enhancements and known issues.
