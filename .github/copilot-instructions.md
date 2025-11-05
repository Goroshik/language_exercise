# Copilot Instructions for Language Exercise App

## Project Overview

Next.js 15 (App Router) language learning platform with AI-powered exercise generation. Users create personalized grammar exercises in multiple languages (English, Polish, etc.) with multi-provider AI support (Gemini, OpenAI, Claude).

## Architecture

### Prisma Configuration (Custom Output)

```bash
# CRITICAL: After schema changes, always run:
prisma generate
```

**Prisma client outputs to `src/generated/prisma`** (not default `node_modules/.prisma`). Import from:

```typescript
import { PrismaClient } from '../generated/prisma'; // or adjust relative path
```

### Repository Pattern

All database access goes through repository layer (`src/repository/`). Single Prisma instance exported from `src/repository/client.ts`:

```typescript
import { wordRepository, userSettingsRepository } from 'src/repository/client';
```

Never instantiate `new PrismaClient()` elsewhere. Repositories wrap Prisma models with domain-specific methods.

### Authentication & Middleware

JWT-based auth using `jose` (not next-auth actively). Middleware (`src/middleware.ts`) extracts userId from JWT and injects into request headers as `x-user-id`. All API routes get userId via:

```typescript
import { getUserIdFromRequest } from 'src/utils/auth';
const userId = getUserIdFromRequest(request); // Throws NextResponseError if unauthorized
```

### AI Service Architecture

**Factory Pattern**: `AIFactory.getAIService(userId)` dynamically selects AI provider based on user settings (`aiModel` field in UserSettings). Services implement `IAIService` interface:

- `GoogleAIService` (gemini-\*)
- `OpenAIService` (gpt-\*)
- `ClaudeAIService` (claude-\*)

All extend `BaseAIService` which handles token retrieval. User tokens stored encrypted in `UserToken` model (see Token Management).

### Token Management (Encryption)

User API tokens encrypted at rest using AES-256-CBC (`src/utils/crypto.ts`). Key from env var `TOKEN_SECRET`. Services retrieve via:

```typescript
// Inside BaseAIService subclass
const token = await this.validateAndGetToken(userId); // Decrypts automatically
```

### Error Handling Pattern

Use `NextResponseError` for consistent API error responses:

```typescript
throw new NextResponseError('Validation failed', 400);
// Middleware catches and returns: { error: '...', status: 400 }
```

## Key Development Workflows

### Database Workflow

1. Edit `prisma/schema.prisma`
2. Run `prisma generate` (updates `src/generated/prisma`)
3. Run database migration (project uses MongoDB with replica set via Docker)
4. Update affected repositories in `src/repository/`

### Local Development

```bash
# Start MongoDB (requires Docker)
docker-compose up -d

# Dev server with Turbopack
npm run dev

# Linting
npm run lint:fix
```

### MongoDB Setup

Docker Compose runs MongoDB 7 in replica set mode (required for transactions). Connection string in `.env`:

```
DATABASE_URL="mongodb://localhost:27017/your_db?replicaSet=rs0"
```

## Project-Specific Conventions

### Exercise Sentence Formats

Two formats exist (handle both in `TextWithInputs` component):

1. **Bold format (newer)**: `"They **visit** many countries last summer"` - Bold word is correct answer, displayed as blank
2. **Placeholder format (legacy)**: `"They {{input}} many countries (visit, visited)"`

AI prompts (`src/prompts/grammarPrompts.ts`) generate bold format. History may contain both.

### Component Organization

- **Form components**: Reusable inputs in `src/components/Form/base/`
- **Feature components**: Top-level features (SettingsModal, AIModelSelector) in `src/components/`
- **Export pattern**: Components exported via `src/components/index.ts` for clean imports

### State Management

Zustand store (`src/store/appStore.ts`) manages exercise state client-side. Server state fetched via `ApiService` (`src/services/apiService.ts`) - centralized fetch wrapper.

### API Route Pattern

```typescript
// Standard route structure
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request); // Auth check
    const body = await safeJson(request); // JSON parsing with error handling

    const result = await processService(body, userId);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    if (error instanceof NextResponseError) return error.response;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### AI Model Configuration

Models defined in `src/constants/aiModels.ts`. To add new model:

1. Add to `AI_MODELS` array with provider mapping
2. Update `AIFactory` provider detection methods (`isGeminiModel`, etc.)
3. Test token retrieval matches service name (gemini/openai/anthropic)

### Translation Services

Dual translation support: DeepL (preferred) and Google Translate (fallback). Service selection based on available tokens. Located in `src/services/deeplTranslate.ts` and `googleTranslate.ts`.

### Word Import System

**Two import methods** (both use same save endpoint):

1. **Manual addition**: Pre-filled modal from translation panel → Review step → Save single word as array
2. **AI-powered import**: Text input → AI parsing (`POST /api/ai/parse-words`) → Review/edit → Save multiple words

**Critical Implementation Details**:

- **API endpoint**: `POST /api/dictionary/words` always expects `{ words: [...] }` array, even for single word
- **Repository method**: `wordRepository.addManyWord(userId, words)` uses `createMany` for batch insert
- **AI parsing**: Factory pattern selects provider (Gemini/OpenAI/Claude) based on user settings
- **Response format**: Parse endpoint returns `{ words: [...] }` NOT `{ success: true, data: [...] }` (see TODO_WORDS.md bug #1.1)

**Component flow**:

```typescript
ImportWordsModal (input step)
  → POST /api/ai/parse-words { text }
  → parseWordsFromTextService → AIFactory → AI Service
  → Returns ParsedWord[]
  → Review step (user edits)
  → POST /api/dictionary/words { words: [...] }
  → wordRepository.addManyWord()
```

**Key files**:

- `src/components/ImportWordsModal.tsx` - Main UI component with 3 steps (input/parsing/review)
- `src/services/parseWordsFromTextService.ts` - AI text parsing orchestration
- `src/services/wordsService.ts` - Word operations (addManyWordService)
- `src/repository/WordRepository.ts` - Database layer with addManyWord method

**Documentation**: See `WORDS_IMPORT.md` for detailed architecture and `TODO_WORDS.md` for planned improvements.

## Important Files

- **`src/middleware.ts`**: JWT verification, userId injection, route protection
- **`src/repository/client.ts`**: Singleton Prisma instance and repository exports
- **`src/services/aiFactory.ts`**: AI provider selection logic
- **`src/prompts/grammarPrompts.ts`**: AI prompt templates for exercise generation
- **`src/utils/crypto.ts`**: Token encryption/decryption
- **`prisma/schema.prisma`**: Database schema (MongoDB with custom output path)
- **`src/components/TextWithInputs.tsx`**: Exercise rendering with dual format support

## Common Pitfalls

1. **Prisma imports**: Always use `src/generated/prisma`, never `@prisma/client`
2. **Auth in API routes**: Don't forget `getUserIdFromRequest()` - middleware only sets header
3. **AI service tokens**: Check user has token for selected model provider (402 error if missing)
4. **MongoDB replica set**: Local dev requires Docker Compose for transactions to work
5. **Sentence history**: Track `usedWordIds` when saving generated sentences for filtering
