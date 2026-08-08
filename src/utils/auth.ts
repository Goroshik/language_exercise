import { NextRequest } from 'next/server';
import { NextResponseError } from './NextResponseError';

export interface AuthResult {
  userId: string;
  error?: string;
}

/**
 * Extracts userId from the x-user-id header, which is set by the middleware
 * after the JWT token has been verified.
 * @throws {NextResponseError} if the user is not authenticated
 * @returns userId of the authenticated user
 */
export function getUserIdFromRequest(request: NextRequest): string {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    throw new NextResponseError('Unauthorized: User ID not found in request headers', 401);
  }
  return userId;
}
