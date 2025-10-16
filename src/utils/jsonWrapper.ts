// Wrapper for request.json() that throws NextResponseError on failure
import { NextResponseError } from './NextResponseError';

export async function safeJson(request: any) {
  try {
    return await request.json();
  } catch (e) {
    throw new NextResponseError('Invalid JSON body', 400);
  }
}
