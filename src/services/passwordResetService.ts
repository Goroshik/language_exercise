import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { userRepository, passwordResetTokenRepository } from '../repository/client';
import { emailService } from './emailService';

export async function requestPasswordResetService(email: string, baseUrl?: string) {
  // Find user by email
  const user = await userRepository.getUserByEmail(email);

  if (!user) {
    // Don't reveal if user exists for security reasons
    return { success: true, message: 'Если пользователь с таким email существует, письмо будет отправлено' };
  }

  // Generate secure random token
  const token = crypto.randomBytes(32).toString('hex');

  // Set expiration time (1 hour from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  // Save token to database
  await passwordResetTokenRepository.createToken(user.id, token, expiresAt);

  // Send email with dynamic URL
  const emailSent = await emailService.sendPasswordResetEmail(user.email, token, baseUrl);

  if (!emailSent) {
    throw new Error('Не удалось отправить email');
  }

  return { success: true, message: 'Письмо для сброса пароля отправлено' };
}

export async function resetPasswordService(token: string, newPassword: string) {
  // Validate token
  const resetToken = await passwordResetTokenRepository.findValidToken(token);

  if (!resetToken) {
    throw new Error('Неверный или истекший токен');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update user password
  await userRepository.updatePassword(resetToken.userId, hashedPassword);

  // Mark token as used
  await passwordResetTokenRepository.markTokenAsUsed(token);

  return { success: true, message: 'Пароль успешно изменён' };
}

export async function verifyResetTokenService(token: string) {
  const resetToken = await passwordResetTokenRepository.findValidToken(token);

  if (!resetToken) {
    return { valid: false };
  }

  return { valid: true, email: resetToken.user.email };
}
