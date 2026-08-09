import type { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { getUserIdFromRequest } from './auth';
import { NextResponseError } from './NextResponseError';

const requestWithHeader = (value: string | null) =>
  ({ headers: { get: (name: string) => (name === 'x-user-id' ? value : null) } }) as NextRequest;

describe('getUserIdFromRequest', () => {
  it('returns the id the middleware put in the header', () => {
    expect(getUserIdFromRequest(requestWithHeader('user-1'))).toBe('user-1');
  });

  it('throws when the header is absent', () => {
    expect(() => getUserIdFromRequest(requestWithHeader(null))).toThrow(NextResponseError);
  });

  it('throws when the header is empty', () => {
    expect(() => getUserIdFromRequest(requestWithHeader(''))).toThrow(/Unauthorized/);
  });

  it('reports 401, not the default 400', () => {
    try {
      getUserIdFromRequest(requestWithHeader(null));
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(NextResponseError);
      expect((error as NextResponseError).status).toBe(401);
    }
  });

  it('only reads x-user-id', () => {
    const request = { headers: { get: () => null } } as unknown as NextRequest;
    expect(() => getUserIdFromRequest(request)).toThrow();
  });
});
