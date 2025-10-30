# AI Chat Implementation

## Overview
This document describes the implementation of the AI chat feature for the language learning application.

## Architecture

### Database Layer
- **Model**: `ChatMessage` in Prisma schema
  - `id`: MongoDB ObjectId
  - `userId`: Reference to User
  - `role`: 'user' or 'assistant'
  - `content`: Message text
  - `createdAt`: Timestamp

- **Repository**: `ChatMessageRepository`
  - `addMessage()`: Save a message to database
  - `getMessages()`: Retrieve chat history
  - `deleteAllMessages()`: Clear chat history for a user

### Backend Service Layer
- **ChatService** (`src/services/chatService.ts`)
  - `sendMessage()`: Processes user message, calls AI service, saves to database
  - `getChatHistory()`: Retrieves chat history from database
  - `clearChatHistory()`: Clears database history

### API Layer
- **POST /api/chat/message**
  - Accepts: `{ message: string }`
  - Returns: `{ message: { role: 'assistant', content: string } }`
  - Requires authentication (userId from JWT middleware)

### Frontend State Management
- **chatStore** (`src/store/chatStore.ts`)
  - Uses Zustand with persist middleware
  - Stores messages in localStorage with key 'chat-storage'
  - State:
    - `messages`: Array of chat messages with timestamps
    - `isOpen`: Chat modal visibility
    - `isLoading`: Loading state during API calls
  - Actions:
    - `addMessage()`: Add message to local store
    - `clearMessages()`: Clear local chat history
    - `setIsOpen()`: Toggle chat modal
    - `setIsLoading()`: Set loading state

### UI Components
- **ChatModal** (`src/components/ChatModal.tsx`)
  - Full-screen modal dialog for chat interface
  - Features:
    - Message history display with user/assistant distinction
    - Text input with multiline support
    - Send button (also supports Enter key)
    - Refresh button to clear local history
    - Auto-scroll to latest message
    - Loading indicator during AI response

- **Header** (`src/components/Header.tsx`)
  - Added chat button with ChatIcon
  - Opens ChatModal on click

## Data Flow

1. **User sends message**:
   ```
   User types → ChatModal → addMessage() to local store
   → POST /api/chat/message → ChatService.sendMessage()
   → AIFactory.getAIService() → AI Provider (Gemini/OpenAI/Claude)
   → Save user message to DB → Save AI response to DB
   → Return AI response → Add to local store → Display in UI
   ```

2. **Local storage (browser)**:
   - Messages persist in localStorage between sessions
   - User can clear with refresh button
   - Not synced from database (local-first approach)

3. **Database storage**:
   - All messages saved to MongoDB
   - Used for history tracking/analytics
   - Can be retrieved with ChatService.getChatHistory()
   - Not displayed in UI by default (as per requirements)

## AI Integration

### Prompt Template
Located in `src/prompts/chatPrompts.ts`:
- System prompt focuses on Polish language learning
- Restricts responses to Polish language-related topics
- Provides Russian language responses with Polish examples

### AI Provider Selection
- Uses existing AIFactory pattern
- Respects user's selected AI model from settings
- Supports all providers: Gemini, OpenAI, Claude

## Security
- JWT authentication required for all chat endpoints
- User can only access their own chat history
- Token validation through middleware

## Usage

### Opening Chat
Click the chat button (ChatIcon) in the header navigation bar.

### Sending Messages
1. Type message in the text field
2. Press Enter or click Send button
3. Wait for AI response

### Clearing Local History
Click the refresh button in the chat modal header, confirm the dialog.

### Database History
- All messages automatically saved
- Not displayed in UI
- Can be queried via ChatService.getChatHistory()

## Future Enhancements
- Chat history viewer page
- Export chat history
- Chat sessions/threads
- Streaming responses for real-time feedback
- Voice input
- Message editing/deletion
