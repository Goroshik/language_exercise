import { NextRequest } from 'next/server';
import { NextResponseError } from './NextResponseError';

export interface AuthResult {
  userId: string;
  error?: string;
}

/**
 * Извлекает userId из JWT токена через заголовок x-user-id
 * который устанавливается middleware после проверки аутентификации
 * @throws {UnauthorizedError} если пользователь не авторизован
 * @returns userId авторизованного пользователя
 */
export function getUserIdFromRequest(request: NextRequest): string {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    throw new NextResponseError('Unauthorized: User ID not found in request headers', 401);
  }
  return userId;
}
