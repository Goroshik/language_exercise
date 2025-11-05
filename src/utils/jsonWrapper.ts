// Wrapper for request.json() that throws NextResponseError on failure
import { NextRequest } from 'next/server';
import { NextResponseError, } from './NextResponseError';

export async function safeJson(request: NextRequest) {
  try {
    return await request.json();
  } catch (_e) {
    throw new NextResponseError('Invalid JSON body', 400);
  }
}
