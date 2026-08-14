import { describe, expect, it } from 'vitest';
import { extractResponseText, isMissingTokenError } from './aiResponse';

describe('extractResponseText', () => {
  it('passes a plain string through', () => {
    expect(extractResponseText('hello')).toBe('hello');
  });

  it('preserves an empty string', () => {
    expect(extractResponseText('')).toBe('');
  });

  it('reads the text field of an object response', () => {
    expect(extractResponseText({ text: 'hello' })).toBe('hello');
  });

  it('returns an empty string for an object without text', () => {
    expect(extractResponseText({ other: 1 })).toBe('');
  });

  it('returns an empty string when text is explicitly undefined', () => {
    expect(extractResponseText({ text: undefined })).toBe('');
  });

  it('reads text out of an array too, since arrays are objects', () => {
    expect(extractResponseText([])).toBe('');
  });

  it.each([null, undefined, 42, true, false])('returns an empty string for %s', value => {
    expect(extractResponseText(value)).toBe('');
  });
});

describe('isMissingTokenError', () => {
  it('recognises the provider message', () => {
    expect(isMissingTokenError(new Error('No token found for service: openai'))).toBe(true);
  });

  it('matches the phrase anywhere in the message', () => {
    expect(isMissingTokenError(new Error('upstream: No token found'))).toBe(true);
  });

  it('rejects an unrelated error', () => {
    expect(isMissingTokenError(new Error('rate limited'))).toBe(false);
  });

  it('is case sensitive, matching what the providers actually emit', () => {
    expect(isMissingTokenError(new Error('no token found'))).toBe(false);
  });

  it.each([null, undefined, 'No token found', { message: 'No token found' }])(
    'rejects the non-Error value %s',
    value => {
      expect(isMissingTokenError(value)).toBe(false);
    }
  );
});
