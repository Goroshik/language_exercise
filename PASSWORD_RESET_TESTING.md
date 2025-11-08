# Password Reset Implementation - Testing Guide

## Manual Testing Steps

Since there's no automated test infrastructure in this project, follow these steps to manually test the password reset functionality.

### Prerequisites

1. MongoDB running (via Docker Compose)
2. Email service configured in `.env`
3. Application running (`npm run dev`)

### Test Case 1: Request Password Reset (Happy Path)

1. Navigate to `/auth/login`
2. Click "Забыли пароль?" button
3. Redirected to `/auth/reset`
4. Enter a valid registered email address
5. Click "Отправить ссылку для сброса"
6. **Expected**: Success message appears
7. **Expected**: Email sent to inbox with reset link

### Test Case 2: Reset Password with Valid Token (Happy Path)

1. Open email from Test Case 1
2. Click the reset link or copy URL
3. **Expected**: Redirected to `/auth/reset?token=...`
4. **Expected**: Token validated successfully
5. Enter new password (minimum 6 characters)
6. Confirm new password (must match)
7. Click "Сбросить пароль"
8. **Expected**: Success message appears
9. **Expected**: Auto-redirect to `/auth/login` after 2 seconds
10. Login with new password
11. **Expected**: Login successful

### Test Case 3: Invalid Email (Security)

1. Navigate to `/auth/reset`
2. Enter non-existent email
3. Click "Отправить ссылку для сброса"
4. **Expected**: Same success message (no user enumeration)
5. **Expected**: No email sent

### Test Case 4: Expired Token

1. Request password reset
2. Wait for token to expire (or manually set short expiration)
3. Click reset link from email
4. **Expected**: Error message "Ссылка недействительна или истекла"
5. **Expected**: Button to request new link

### Test Case 5: Used Token (Single Use)

1. Complete password reset successfully
2. Try to use the same token link again
3. **Expected**: Error message about invalid/expired token
4. **Expected**: Cannot reuse token

### Test Case 6: Password Validation

1. Get valid reset token
2. Enter password less than 6 characters
3. **Expected**: Error "Пароль должен содержать минимум 6 символов"
4. Enter password and different confirmation
5. **Expected**: Error "Пароли не совпадают"

### Test Case 7: Direct Access to Reset Page

1. Navigate to `/auth/reset` directly (no token)
2. **Expected**: Shows email input form
3. Navigate to `/auth/reset?token=invalid`
4. **Expected**: Shows error message about invalid token

### Test Case 8: Email Service Not Configured

1. Remove email configuration from `.env`
2. Restart application
3. Request password reset
4. **Expected**: Console logs "Email service not configured"
5. **Expected**: Error message to user

## API Testing with cURL

### Request Password Reset
```bash
curl -X POST http://localhost:3000/api/auth/request-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Письмо для сброса пароля отправлено"
}
```

### Verify Token
```bash
curl -X GET "http://localhost:3000/api/auth/verify-token?token=YOUR_TOKEN_HERE"
```

Expected response (valid):
```json
{
  "valid": true,
  "email": "test@example.com"
}
```

Expected response (invalid):
```json
{
  "valid": false
}
```

### Reset Password
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_TOKEN_HERE","newPassword":"newpass123"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Пароль успешно изменён"
}
```

## Database Verification

Check if tokens are created correctly:

```javascript
// In MongoDB shell or Compass
db.password_reset_tokens.find({}).pretty()
```

Expected fields:
- `_id`: ObjectId
- `userId`: ObjectId reference
- `token`: 64-character hex string
- `expiresAt`: Date (1 hour from createdAt)
- `used`: boolean (false initially)
- `createdAt`: Date

After successful reset, verify token is marked as used:
```javascript
db.password_reset_tokens.find({ used: true })
```

## Email Testing Services

### Mailtrap (Recommended for Development)
1. Sign up at [mailtrap.io](https://mailtrap.io)
2. Get SMTP credentials from inbox settings
3. Configure in `.env`:
```env
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_mailtrap_user
EMAIL_PASSWORD=your_mailtrap_password
EMAIL_FROM=noreply@languageexercise.com
```
4. All emails will be caught in Mailtrap inbox (not sent to real addresses)

### Gmail (For Production-like Testing)
1. Enable 2-factor authentication on Gmail account
2. Generate app-specific password
3. Configure in `.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your.email@gmail.com
```

## Security Checklist

- [ ] Tokens are random and unpredictable (32 bytes)
- [ ] Tokens expire after 1 hour
- [ ] Tokens can only be used once
- [ ] Same response for valid/invalid emails (no enumeration)
- [ ] Passwords are hashed with bcrypt
- [ ] Links use HTTPS in production
- [ ] Email rate limiting considered (future improvement)
- [ ] reCAPTCHA considered (future improvement)

## Common Issues and Solutions

### Issue: Email not sent
- Check email configuration in `.env`
- Check console logs for initialization errors
- Verify SMTP credentials
- Check firewall/port blocking

### Issue: Token always invalid
- Check server time vs database time (timezone issues)
- Verify token is copied correctly from email
- Check if token was already used

### Issue: Build fails
- Run `npx prisma generate` after schema changes
- Clear `.next` directory and rebuild
- Check for TypeScript errors

## Performance Considerations

- Cleanup expired tokens periodically (consider adding cron job)
- Add database index on `token` field for faster lookup
- Consider rate limiting on request-reset endpoint
- Monitor email sending failures

## Monitoring in Production

Log important events:
- Password reset requests
- Failed token validations
- Email sending failures
- Successful password resets

Consider adding:
- Metrics for reset request volume
- Alert for high failure rates
- Track time between request and reset
