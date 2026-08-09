import { describe, expect, it } from 'vitest';
import { NextResponseError } from './NextResponseError';

describe('NextResponseError', () => {
  it('uses a string payload as the message verbatim', () => {
    expect(new NextResponseError('boom').message).toBe('boom');
  });

  it('serialises a non-string payload into the message', () => {
    expect(new NextResponseError({ field: 'email' }).message).toBe('{"field":"email"}');
  });

  it('defaults to status 400', () => {
    expect(new NextResponseError('boom').status).toBe(400);
  });

  it('keeps an explicit status', () => {
    expect(new NextResponseError('boom', 401).status).toBe(401);
  });

  it('keeps the payload for the response body', () => {
    const payload = { field: 'email' };
    expect(new NextResponseError(payload).error).toEqual(payload);
  });

  it('is a real Error', () => {
    expect(new NextResponseError('boom')).toBeInstanceOf(Error);
  });

  it('builds a response carrying the status and payload', async () => {
    const response = new NextResponseError({ field: 'email' }, 422).response;
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ error: { field: 'email' } });
  });
});
