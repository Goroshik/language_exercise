import type { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { safeJson } from './jsonWrapper';
import { NextResponseError } from './NextResponseError';

const requestReturning = (body: () => Promise<unknown>) => ({ json: body }) as NextRequest;

describe('safeJson', () => {
  it('passes a parsed body straight through', async () => {
    const request = requestReturning(() => Promise.resolve({ word: 'książka' }));
    await expect(safeJson(request)).resolves.toEqual({ word: 'książka' });
  });

  it('preserves falsy bodies rather than treating them as failures', async () => {
    await expect(safeJson(requestReturning(() => Promise.resolve(null)))).resolves.toBeNull();
  });

  it('turns a parse failure into a 400', async () => {
    const request = requestReturning(() => Promise.reject(new SyntaxError('Unexpected token')));
    await expect(safeJson(request)).rejects.toThrow(NextResponseError);
  });

  it('hides the underlying parser message', async () => {
    const request = requestReturning(() => Promise.reject(new SyntaxError('Unexpected token <')));
    await expect(safeJson(request)).rejects.toThrow('Invalid JSON body');
  });

  it('reports status 400 on a parse failure', async () => {
    const request = requestReturning(() => Promise.reject(new Error('nope')));
    await expect(safeJson(request)).rejects.toMatchObject({ status: 400 });
  });
});
