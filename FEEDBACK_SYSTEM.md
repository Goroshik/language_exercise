# Feedback System Documentation

## Overview

The Feedback System allows users to submit bug reports and feature requests directly from the application. Submissions are automatically created as GitHub issues in the repository with appropriate labels and mentions.

## User Interface

### Access Points

The feedback form can be accessed from two locations:

1. **Desktop Header**: Feedback icon button (💬) between "AI модель" and "Настройки" buttons
2. **Mobile Menu**: "Обратная связь" menu item in the hamburger menu drawer

### Form Fields

The feedback modal contains three fields:

1. **Type (Тип)**: Dropdown selector
   - 🐛 Баг (Bug) - For reporting issues
   - 💡 Фича (Feature) - For suggesting improvements

2. **Title (Заголовок)**: Text input
   - Required field
   - Maximum 200 characters
   - Brief description of the issue or feature

3. **Description (Описание)**: Multi-line text area
   - Required field
   - Detailed explanation of the problem or suggestion

### Validation

- Both title and description fields are required
- User receives error alerts if required fields are empty
- Success alert shown when issue is created successfully

## Technical Implementation

### Components

**`FeedbackModal.tsx`**
- React component using Material-UI Dialog
- Manages form state and submission
- Responsive design (fullscreen on mobile)
- Loading states during submission

**`Header.tsx`**
- Integrated feedback button in desktop header
- Added to mobile menu drawer
- Uses FeedbackIcon from @mui/icons-material

### API Endpoint

**`POST /api/feedback`**

Creates a GitHub issue using the Octokit REST API.

**Request Body:**
```json
{
  "type": "bug" | "feature",
  "title": "string",
  "description": "string"
}
```

**Response:**
```json
{
  "success": true,
  "issueNumber": 123,
  "issueUrl": "https://github.com/owner/repo/issues/123"
}
```

**Error Response:**
```json
{
  "error": "Error message"
}
```

### GitHub Integration

The endpoint uses `@octokit/rest` to interact with GitHub API:

- Creates issues with emoji prefixes (🐛 for bugs, 💡 for features)
- Automatically adds appropriate labels:
  - `bug` for bug reports
  - `enhancement` for feature requests
- Mentions @Goroshik in the issue body

## Configuration

### Environment Variables

Required environment variables (add to `.env` file):

```bash
# GitHub Personal Access Token with 'repo' scope
GITHUB_TOKEN="your-github-personal-access-token"

# Repository owner (username or organization)
GITHUB_OWNER="Goroshik"

# Repository name
GITHUB_REPO="language_exercise"
```

### Setting Up GitHub Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Language Exercise Feedback")
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
5. Generate token and copy it
6. Add to `.env` file as `GITHUB_TOKEN`

**Note**: Keep the token secure and never commit it to version control.

## Security Considerations

- No authentication required to submit feedback (public endpoint)
- Rate limiting should be considered for production
- Input validation prevents malformed requests
- GitHub token is stored server-side only (not exposed to client)

## Future Enhancements

Potential improvements for the feedback system:

1. **User Context**: Include authenticated user information in issues
2. **Screenshots**: Allow users to attach screenshots
3. **Auto-populate**: Include browser/device info automatically
4. **Email Notifications**: Notify user when their issue is addressed
5. **Issue Templates**: Pre-fill description with structured format
6. **Rate Limiting**: Prevent spam submissions
7. **Issue Search**: Check for duplicates before creating
8. **Labels Management**: Allow more granular categorization

## Troubleshooting

### Common Issues

**"GitHub integration is not configured"**
- Solution: Ensure `GITHUB_TOKEN` is set in environment variables

**"Failed to create issue"**
- Check GitHub token has correct permissions
- Verify repository name and owner are correct
- Check GitHub API rate limits

**Form doesn't submit**
- Ensure both title and description are filled
- Check browser console for errors
- Verify network connectivity

## Testing

To test the feedback system:

1. Set up environment variables
2. Start the development server: `npm run dev`
3. Navigate to the application
4. Click the feedback icon in the header
5. Fill out the form with test data
6. Submit and verify issue appears in GitHub repository

## Code References

- **Modal Component**: `src/components/FeedbackModal.tsx`
- **API Route**: `src/app/api/feedback/route.ts`
- **Header Integration**: `src/components/Header.tsx`
- **Component Export**: `src/components/index.ts`
