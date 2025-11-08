# Essay Writing Feature Documentation

## Overview
This feature provides users with a dedicated page for writing essays in their learning language with AI-powered feedback and checking.

## Features

### 1. Essay Management
- **Create/Edit Essays**: Users can write essays on various topics
- **Auto-save**: Essays are automatically saved 2 seconds after the user stops typing
- **Topic Selection**: Dropdown with default topics and previously written essays
- **Multiple Languages**: Supports all learning languages (English, Polish, etc.)

### 2. AI-Powered Checking
- **Grammar Analysis**: Checks for grammatical errors
- **Punctuation Review**: Identifies punctuation mistakes
- **Complexity Assessment**: Evaluates text complexity
- **CEFR Level Detection**: Determines approximate language level (A1-C2)

### 3. Interactive Feedback
- **Color-Coded Errors**: Each error type has a unique soft, semi-transparent color
- **Interactive Highlighting**: Hover over error numbers to highlight the corresponding text
- **Detailed Explanations**: Each error includes a clear explanation in Russian
- **Summary**: Overall text assessment with strengths and improvement areas

### 4. User Experience
- **Word Counter**: Real-time word and character count
- **Clear Button**: Reset input fields with tooltip explanation
- **Responsive Design**: Works on mobile and desktop
- **Visual Feedback**: Loading states and save indicators

## Technical Implementation

### Database Schema
```prisma
model Essay {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  userId       String   @db.ObjectId
  title        String
  content      String
  aiResponse   String?  // JSON format
  languageCode String
  level        String?  // CEFR level (A1-C2)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### API Endpoints

#### Essays CRUD
- `GET /api/essays?languageCode=en` - List all essays for user
- `POST /api/essays` - Create new essay
- `GET /api/essays/[id]` - Get specific essay
- `PATCH /api/essays/[id]` - Update essay
- `DELETE /api/essays/[id]` - Delete essay

#### Essay Checking
- `POST /api/essays/check` - Check essay with AI
  - Request: `{ essayId, content, languageCode }`
  - Response: `{ level, errors[], summary }`

#### Default Topics
- `GET /api/essays/default-topics?languageCode=en` - Get default essay topics

### AI Response Format
```json
{
  "level": "B1",
  "errors": [
    {
      "text": "exact text fragment with error",
      "explanation": "Explanation in Russian",
      "color": "#FFE5E5",
      "type": "grammar"
    }
  ],
  "summary": "Overall assessment in Russian"
}
```

### Error Types
- `grammar` - Grammatical errors (soft red tones)
- `punctuation` - Punctuation errors (soft orange tones)
- `style` - Style suggestions (soft blue tones)
- `vocabulary` - Vocabulary improvements (soft green tones)

## Usage

1. **Navigate to Essay Page**: Click the "Сочинения" button in the header
2. **Select or Enter Topic**: Use the dropdown to select a default topic or enter a custom one
3. **Write Essay**: Type your text in the left panel
4. **Auto-save**: Text is automatically saved every 2 seconds
5. **Check**: Click "Проверить" to get AI feedback
6. **Review Feedback**: View highlighted errors and explanations in the right panel
7. **Hover Interaction**: Hover over error numbers or highlighted text to see connections

## Security Considerations
- ✅ User authentication required for all operations
- ✅ Essays are scoped to user (userId verification)
- ✅ Input validation on all API endpoints
- ✅ AI token encryption
- ✅ No SQL injection risks (Prisma ORM)
- ✅ No XSS vulnerabilities (React escaping)
- ✅ CodeQL security scan passed

## Future Enhancements
- [ ] Export essays to PDF
- [ ] Version history for essays
- [ ] AI suggestions for improvements
- [ ] Plagiarism detection
- [ ] Essay templates
- [ ] Progress tracking over time
- [ ] Comparison of multiple essay versions
