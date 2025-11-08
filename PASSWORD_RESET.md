# Password Reset Feature Documentation

## Overview

This document describes the password reset functionality that allows users to securely reset their passwords via email.

## Architecture

The password reset feature follows a secure two-step process:

1. **Request Reset**: User enters their email and receives a password reset link
2. **Reset Password**: User clicks the link in email and sets a new password

## Components

### Database

**PasswordResetToken Model** (`prisma/schema.prisma`):
- `id`: Unique identifier
- `userId`: Reference to User
- `token`: Unique reset token (32-byte random hex)
- `expiresAt`: Token expiration (1 hour from creation)
- `used`: Flag to prevent token reuse
- `createdAt`: Token creation timestamp

### Backend Services

**PasswordResetTokenRepository** (`src/repository/PasswordResetTokenRepository.ts`):
- `createToken(userId, token, expiresAt)`: Create new reset token
- `findValidToken(token)`: Find unused, non-expired token
- `markTokenAsUsed(token)`: Mark token as used after password reset
- `deleteExpiredTokens()`: Cleanup expired tokens

**EmailService** (`src/services/emailService.ts`):
- Configurable SMTP email sending with nodemailer
- `sendPasswordResetEmail(email, token)`: Send formatted reset email with link
- `isConfigured()`: Check if email is properly configured

**PasswordResetService** (`src/services/passwordResetService.ts`):
- `requestPasswordResetService(email)`: Generate token and send email
- `resetPasswordService(token, newPassword)`: Validate token and update password
- `verifyResetTokenService(token)`: Check if token is valid

### API Endpoints

**POST /api/auth/request-reset**:
- Request: `{ email: string }`
- Response: `{ success: boolean, message: string }`
- Action: Creates reset token and sends email

**POST /api/auth/reset-password**:
- Request: `{ token: string, newPassword: string }`
- Response: `{ success: boolean, message: string }`
- Action: Validates token and updates password

**GET /api/auth/verify-token**:
- Query: `?token=...`
- Response: `{ valid: boolean, email?: string }`
- Action: Verifies if token is valid and not expired

### Frontend

**Reset Password Page** (`src/app/auth/reset/page.tsx`):
- Two modes based on URL:
  - Without token: Shows email input to request reset
  - With token: Shows password input to complete reset
- Validates passwords match and meet minimum length
- Shows loading states and success/error messages
- Auto-redirects to login after successful reset

## Configuration

Add these environment variables to `.env`:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Email Provider Setup

**Gmail**:
1. Enable 2-factor authentication
2. Generate app-specific password
3. Use `smtp.gmail.com` port `587`

**Mailtrap** (for testing):
1. Create free account at mailtrap.io
2. Use provided SMTP credentials
3. All emails are caught in inbox (not sent)

**Other Providers**:
- Outlook: `smtp-mail.outlook.com:587`
- SendGrid, Mailgun, AWS SES, etc. supported

## Security Features

1. **No User Enumeration**: Same message returned whether email exists or not
2. **Token Expiration**: Tokens expire after 1 hour
3. **Single Use**: Tokens marked as used after password reset
4. **Secure Random**: Tokens generated with crypto.randomBytes (32 bytes)
5. **Password Hashing**: Passwords hashed with bcrypt before storage
6. **HTTPS Recommended**: Use HTTPS in production for secure email links

## User Flow

1. User clicks "Забыли пароль?" on login page
2. User enters email address
3. System sends email with reset link
4. User clicks link in email (valid 1 hour)
5. User enters and confirms new password
6. Password updated, user redirected to login
7. User logs in with new password

## Error Handling

- Invalid/expired token: Clear error message with option to request new link
- Email not configured: Service logs warning, returns error to user
- Network errors: Generic "Ошибка сервера" message
- Validation errors: Specific messages (password too short, passwords don't match, etc.)

## Testing

To test locally without sending real emails:

1. Use [Mailtrap](https://mailtrap.io) for email testing
2. Or check server logs for the reset URL (when email service not configured)
3. Copy token from URL and test reset flow

## Future Improvements

- Add rate limiting to prevent email spam
- Add reCAPTCHA to prevent abuse
- Cleanup expired tokens with cron job
- Add email templates with better styling
- Support multiple languages for email content
- Add "remember this device" option
