import { beforeEach, describe, expect, it, vi } from 'vitest';

const jwtVerify = vi.fn();
vi.mock('jose', () => ({ jwtVerify: (...a: unknown[]) => jwtVerify(...a) }));

const {
  PUBLIC_ROUTES,
  decideRoute,
  isApiRoute,
  isAuthEndpoint,
  isPublicRoute,
  jwtCookieName,
  userIdFromToken
} = await import('./authRouting');

beforeEach(() => {
  vi.clearAllMocks();
  process.env.JWT_SECRET = 'test-secret';
});

describe('route predicates', () => {
  it.each(PUBLIC_ROUTES)('treats %s as public', route => {
    expect(isPublicRoute(route)).toBe(true);
  });

  it('treats a nested public path as public', () => {
    expect(isPublicRoute('/auth/login/step-2')).toBe(true);
  });

  it('treats an app page as private', () => {
    expect(isPublicRoute('/topics')).toBe(false);
  });

  it('recognises api routes', () => {
    expect(isApiRoute('/api/topics')).toBe(true);
    expect(isApiRoute('/topics')).toBe(false);
  });

  it('recognises the auth endpoints', () => {
    expect(isAuthEndpoint('/api/auth/login')).toBe(true);
    expect(isAuthEndpoint('/api/topics')).toBe(false);
  });
});

describe('jwtCookieName', () => {
  it('defaults to app_token', () => {
    delete process.env.JWT_COOKIE_NAME;
    expect(jwtCookieName()).toBe('app_token');
  });

  it('honours the environment', () => {
    process.env.JWT_COOKIE_NAME = 'custom';
    expect(jwtCookieName()).toBe('custom');
    delete process.env.JWT_COOKIE_NAME;
  });
});

describe('userIdFromToken', () => {
  it('returns null without a token', async () => {
    await expect(userIdFromToken(undefined)).resolves.toBeNull();
    expect(jwtVerify).not.toHaveBeenCalled();
  });

  it('returns null for an empty token', async () => {
    await expect(userIdFromToken('')).resolves.toBeNull();
  });

  it('returns the id from a valid token', async () => {
    jwtVerify.mockResolvedValue({ payload: { id: 'u1' } });
    await expect(userIdFromToken('token')).resolves.toBe('u1');
  });

  it('returns null when verification fails', async () => {
    jwtVerify.mockRejectedValue(new Error('expired'));
    await expect(userIdFromToken('token')).resolves.toBeNull();
  });

  it('returns null when the payload carries no id', async () => {
    jwtVerify.mockResolvedValue({ payload: {} });
    await expect(userIdFromToken('token')).resolves.toBeNull();
  });

  it('returns null when the id is not a string', async () => {
    jwtVerify.mockResolvedValue({ payload: { id: 42 } });
    await expect(userIdFromToken('token')).resolves.toBeNull();
  });
});

describe('decideRoute', () => {
  it('always lets the auth endpoints through, signed out', () => {
    expect(decideRoute('/api/auth/login', null)).toEqual({ kind: 'continue' });
  });

  it('always lets the auth endpoints through, signed in', () => {
    expect(decideRoute('/api/auth/logout', 'u1')).toEqual({ kind: 'continue' });
  });

  it('pushes a signed-in user off the login page', () => {
    expect(decideRoute('/auth/login', 'u1')).toEqual({ kind: 'redirect', to: '/topics' });
  });

  it('injects the user id into api calls', () => {
    expect(decideRoute('/api/topics', 'u1')).toEqual({ kind: 'inject-user', userId: 'u1' });
  });

  it('lets a signed-in user open an app page', () => {
    expect(decideRoute('/topics', 'u1')).toEqual({ kind: 'continue' });
  });

  it('lets a signed-out user reach the login page', () => {
    expect(decideRoute('/auth/login', null)).toEqual({ kind: 'continue' });
  });

  it('answers 401 rather than redirecting an api call', () => {
    expect(decideRoute('/api/topics', null)).toEqual({ kind: 'unauthorized' });
  });

  it('sends a signed-out user to login, remembering where they were going', () => {
    expect(decideRoute('/exercises/past_simple', null)).toEqual({
      kind: 'redirect',
      to: '/auth/login',
      callbackUrl: '/exercises/past_simple'
    });
  });

  it('never leaks a callback url when redirecting a signed-in user', () => {
    expect(decideRoute('/auth/reset', 'u1')).not.toHaveProperty('callbackUrl');
  });
});
