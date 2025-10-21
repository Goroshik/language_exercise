# AI Model Selector Implementation Summary

## Overview

Implemented a new AI model selector feature in the header that allows users to quickly and easily select which AI model to use for text generation.

## Requirements Met ✅

1. **✅ Button in Header**: Added a new button with SmartToy icon in the header that opens the AI model selection modal
2. **✅ Token-Based Filtering**: Only displays models for which the user has configured API tokens
3. **✅ Provider-Specific Model Filtering**: When selecting a provider (Gemini/OpenAI/Claude), only shows models for that provider
4. **✅ Single Token Auto-Selection**: If only one token is available, automatically selects that provider and disables the provider dropdown
5. **✅ No Token Handling**: If no tokens are configured, displays a warning message directing users to settings
6. **✅ Database Persistence**: Model changes are saved to the database using the existing `/api/settings` endpoint

## Implementation Details

### New Components

#### 1. AIModelSelector Component (`src/components/AIModelSelector.tsx`)

- **Purpose**: Modal dialog for selecting AI models
- **Features**:
  - Fetches available models based on user's API tokens
  - Two-level selection: Provider → Model
  - Auto-selects provider when only one token exists
  - Displays current selected model
  - Saves selection to database
  - Shows appropriate messages for different states (no tokens, loading, errors)
- **State Management**:
  - Loading states for data fetching and saving
  - Error and success message handling
  - Provider and model selection tracking

#### 2. AI Models Constants (`src/constants/aiModels.ts`)

- **Purpose**: Centralized model definitions and utilities
- **Contents**:
  - `AIModel` interface defining model structure
  - `AI_MODELS` array with all supported models (Gemini, OpenAI, Claude)
  - `PROVIDER_LABELS` mapping for UI display
  - Helper functions:
    - `getModelsByProvider()`: Filter models by provider
    - `getProviderFromModel()`: Get provider from model name
    - `getModelLabel()`: Get display label for model

#### 3. Available Models API (`src/app/api/ai/available-models/route.ts`)

- **Purpose**: REST endpoint to fetch user's available models
- **Logic**:
  1. Gets user ID from request
  2. Fetches user's tokens from database
  3. Maps token services to AI providers (gemini, openai, anthropic)
  4. Filters models to only those with available tokens
  5. Returns structured response with providers, models, and token status

### Modified Components

#### Header Component (`src/components/Header.tsx`)

- **Changes**:
  - Added SmartToy icon import from Material-UI
  - Added AIModelSelector component import
  - Added state for modal open/close
  - Added new icon button in header toolbar
  - Added AIModelSelector modal with open/close handlers

## Technical Design

### Data Flow

```
User clicks AI Model button in Header
    ↓
AIModelSelector modal opens
    ↓
Fetches data from two endpoints:
  - GET /api/ai/available-models (available models based on tokens)
  - GET /api/settings (current user settings)
    ↓
Displays filtered models based on:
  - User's available API tokens
  - Selected provider
    ↓
User selects provider and model
    ↓
Clicks Save button
    ↓
PATCH /api/settings { aiModel: "selected-model" }
    ↓
Success message shown, modal closes after 1 second
```

### Provider-Token Mapping

- `gemini` token → Gemini models (gemini-2.0-flash-exp, gemini-2.5-flash, etc.)
- `openai` token → OpenAI models (gpt-4o, gpt-4o-mini, etc.)
- `anthropic` token → Claude models (claude-3-5-sonnet, claude-3-opus, etc.)

### Auto-Selection Logic

1. **No tokens**: Show warning, disable all controls
2. **One token**: Auto-select provider, disable provider dropdown
3. **Current model's provider available**: Pre-select that provider and model
4. **Current model's provider not available**: Select first available provider and its first model
5. **Multiple tokens**: Enable all controls, pre-select based on current settings

## User Interface (Russian Locale)

### Modal Elements

- **Title**: "Выбор AI модели"
- **Provider Label**: "Провайдер"
- **Model Label**: "Модель"
- **Current Model Label**: "Текущая модель:"
- **Warning Message**: "У вас нет добавленных токенов. Пожалуйста, добавьте токен в настройках, чтобы использовать AI модели."
- **Buttons**: "Отмена" (Cancel), "Сохранить" (Save), "Сохранение..." (Saving)
- **Error Message**: "Не удалось загрузить данные" / "Не удалось сохранить модель"
- **Success Message**: "Модель успешно сохранена!"

### Header Icon

- **Tooltip**: "AI модель"
- **Icon**: SmartToy (robot icon)
- **Style**: White background with primary color icon, matches other header buttons

## File Structure

```
src/
├── components/
│   ├── AIModelSelector.tsx          [NEW]
│   └── Header.tsx                    [MODIFIED]
├── constants/
│   └── aiModels.ts                   [NEW]
└── app/
    └── api/
        └── ai/
            └── available-models/
                └── route.ts          [NEW]
```

## Testing Checklist

- [ ] User with no tokens sees warning message
- [ ] User with one token has provider auto-selected and disabled
- [ ] User with multiple tokens can freely select provider and model
- [ ] Provider change updates available models list
- [ ] Selected model saves to database successfully
- [ ] Current model displays correctly on modal open
- [ ] Modal closes after successful save
- [ ] Error messages display appropriately
- [ ] Loading states work correctly
- [ ] Save button disabled when no changes made

## Dependencies

- Material-UI components (Dialog, Select, Button, etc.)
- Existing API endpoints (/api/settings, /api/tokens)
- Existing repositories (userTokenRepository, userSettingsRepository)
- React hooks (useState, useEffect)

## Database Schema

Uses existing `UserSettings` table with `aiModel` field to store selected model.

## Future Enhancements (Out of Scope)

- Display model capabilities/pricing in selector
- Show model performance metrics
- Add favorites or recently used models
- Model availability status (API health check)
- Estimate token costs for selected model

## Compatibility

- Next.js 15.5.4
- React 19.1.0
- Material-UI 7.3.4
- TypeScript 5.9.2
