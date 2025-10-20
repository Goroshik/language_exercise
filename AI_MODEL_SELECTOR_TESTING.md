# AI Model Selector Testing Guide

## Overview
This document describes the new AI Model Selector feature and how to test it.

## Feature Description
A new button has been added to the header that opens a modal for selecting AI models used for text generation.

### Key Features:
1. **Smart Token Detection**: Only shows models for which the user has API tokens
2. **Provider Filtering**: When selecting a provider (Gemini, OpenAI, or Claude), only shows models for that provider
3. **Auto-Selection**: If only one token is available, automatically selects that provider
4. **No Token Handling**: If no tokens are configured, shows a warning message and directs user to settings
5. **Database Persistence**: Model selection is saved to the database via the `/api/settings` endpoint

## Components Added

### 1. AIModelSelector Modal Component
- Location: `src/components/AIModelSelector.tsx`
- Features:
  - Fetches available models based on user tokens
  - Two-step selection: Provider → Model
  - Displays current model
  - Saves selection to database using PATCH request

### 2. AI Models Constants
- Location: `src/constants/aiModels.ts`
- Contains:
  - Model definitions with labels and provider mappings
  - Helper functions for filtering and querying models

### 3. Available Models API Endpoint
- Location: `src/app/api/ai/available-models/route.ts`
- Returns:
  - List of available providers (based on user tokens)
  - List of available models
  - Boolean indicating if user has any tokens

### 4. Updated Header Component
- Location: `src/components/Header.tsx`
- Changes:
  - Added SmartToy icon button for AI model selection
  - Integrated AIModelSelector modal

## Testing Steps

### Prerequisites
1. Login to the application
2. Ensure you have at least one API token configured (Settings → API Tokens)

### Test Case 1: User with One Token
1. Login to the application
2. Go to Settings and add only one token (e.g., Gemini token)
3. Click the AI model icon (robot icon) in the header
4. **Expected**: Provider dropdown should be disabled and auto-selected to Gemini
5. Model dropdown should show only Gemini models
6. Select a model and click Save
7. **Expected**: Success message and modal closes
8. Reopen the modal
9. **Expected**: Selected model should be displayed as "Current model"

### Test Case 2: User with Multiple Tokens
1. Login to the application
2. Go to Settings and add tokens for multiple providers (e.g., Gemini and OpenAI)
3. Click the AI model icon in the header
4. **Expected**: Provider dropdown should be enabled
5. Select "Gemini" from provider dropdown
6. **Expected**: Only Gemini models should appear in model dropdown
7. Select "OpenAI" from provider dropdown
8. **Expected**: Only OpenAI models should appear in model dropdown
9. Select a model and save
10. Verify the model is saved by reopening the modal

### Test Case 3: User with No Tokens
1. Login to the application
2. Go to Settings and delete all API tokens
3. Click the AI model icon in the header
4. **Expected**: Warning message should appear saying "У вас нет добавленных токенов..."
5. **Expected**: Provider and Model dropdowns should not be shown
6. **Expected**: Save button should not be shown
7. Close the modal and add a token in Settings
8. Reopen AI model selector
9. **Expected**: Dropdowns should now be visible and functional

### Test Case 4: Model Persistence
1. Select an AI model using the AI model selector
2. Click Save
3. Logout and login again
4. Generate some text (using the text generation feature)
5. Verify that the generated text uses the model you selected

## API Integration

### GET /api/ai/available-models
Returns available models based on user's tokens:
```json
{
  "providers": ["gemini", "openai"],
  "models": [
    {
      "value": "gemini-2.5-flash",
      "label": "Gemini 2.5 Flash",
      "provider": "gemini"
    },
    ...
  ],
  "hasTokens": true
}
```

### PATCH /api/settings
Updates user settings with selected model:
```json
{
  "aiModel": "gemini-2.5-flash"
}
```

## UI/UX Notes
- Modal title: "Выбор AI модели"
- Provider dropdown disabled if only one provider available
- Model dropdown disabled if no provider selected
- Current model displayed in a gray box at the bottom
- Save button disabled if no changes or no model selected
- All text is in Russian to match the application locale

## Known Limitations
1. Requires authentication to access
2. Database must have UserSettings table with aiModel field
3. UserToken table must have tokens for respective providers

## Files Modified/Created
- **Created**: `src/components/AIModelSelector.tsx`
- **Created**: `src/constants/aiModels.ts`
- **Created**: `src/app/api/ai/available-models/route.ts`
- **Modified**: `src/components/Header.tsx`
