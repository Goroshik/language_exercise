import { NextRequest } from 'next/server';

export interface AuthResult {
  userId: string;
  error?: string;
}

/**
 * Извлекает userId из JWT токена через заголовок x-user-id
 * который устанавливается middleware после проверки аутентификации
 */
export function getUserIdFromRequest(request: NextRequest): AuthResult {
  const userId = request.headers.get('x-user-id');
  
  if (!userId) {
    return {
      userId: '',
      error: 'Unauthorized: User ID not found in request headers'
    };
  }
  
  return { userId };
}

/**
 * Пытается получить userId из заголовка, иначе — из серверной сессии NextAuth (Node runtime)
 */
export async function getUserIdOrUnauthorized(request: NextRequest): Promise<AuthResult> {
  const fromHeader = request.headers.get('x-user-id');
  if (fromHeader) {
    return { userId: fromHeader };
  }

  return { userId: '', error: 'Unauthorized: no token' };
}

/**
 * Создает стандартизированный ответ 401 Unauthorized
 */
export function createUnauthorizedResponse(error: string) {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: 'Unauthorized',
      message: error 
    }),
    { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
