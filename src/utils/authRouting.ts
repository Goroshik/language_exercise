/**
 * Routing decisions the middleware makes, kept separate from NextRequest so the
 * rules can be tested without constructing a request.
 */
import { jwtVerify } from 'jose';

export const PUBLIC_ROUTES = ['/auth/login', '/auth/reset'];

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

export function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api');
}

/** The auth endpoints have to stay reachable while signed out. */
export function isAuthEndpoint(pathname: string): boolean {
  return pathname.startsWith('/api/auth');
}

export function jwtCookieName(): string {
  return process.env.JWT_COOKIE_NAME || 'app_token';
}

/**
 * The user id carried by a JWT, or null when the token is missing, malformed,
 * expired, or carries no string id.
 */
export async function userIdFromToken(rawToken: string | undefined): Promise<string | null> {
  if (!rawToken) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(rawToken, secret);
    const id = (payload as { id?: unknown }).id;
    return typeof id === 'string' ? id : null;
  } catch {
    return null;
  }
}

export type RouteAction =
  | { kind: 'continue' }
  | { kind: 'inject-user'; userId: string }
  | { kind: 'redirect'; to: string; callbackUrl?: string }
  | { kind: 'unauthorized' };

/**
 * What to do with a request, given who is asking and where they are going.
 * Signed-in users are pushed off the auth pages; signed-out users are pushed
 * onto them, except for API calls which get a 401 instead of a redirect.
 */
export function decideRoute(pathname: string, userId: string | null): RouteAction {
  if (isAuthEndpoint(pathname)) return { kind: 'continue' };

  const isPublic = isPublicRoute(pathname);
  const isApi = isApiRoute(pathname);

  if (userId) {
    if (isPublic) return { kind: 'redirect', to: '/topics' };
    return isApi ? { kind: 'inject-user', userId } : { kind: 'continue' };
  }

  if (isPublic) return { kind: 'continue' };

  return isApi
    ? { kind: 'unauthorized' }
    : { kind: 'redirect', to: '/auth/login', callbackUrl: pathname };
}
