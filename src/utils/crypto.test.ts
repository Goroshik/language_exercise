import { describe, expect, it } from 'vitest';
import { decrypt, encrypt } from './crypto';

// aes-256-cbc needs a 32-byte key.
const KEY = '0123456789abcdef0123456789abcdef';
const OTHER_KEY = 'fedcba9876543210fedcba9876543210';

describe('encrypt / decrypt', () => {
  it('round-trips a plain string', () => {
    expect(decrypt(encrypt('hello', KEY), KEY)).toBe('hello');
  });

  it('round-trips non-ASCII text', () => {
    const secret = 'Привет, świat! 🎉';
    expect(decrypt(encrypt(secret, KEY), KEY)).toBe(secret);
  });

  it('round-trips an empty string', () => {
    expect(decrypt(encrypt('', KEY), KEY)).toBe('');
  });

  it('produces a different ciphertext each time (random IV)', () => {
    expect(encrypt('hello', KEY)).not.toBe(encrypt('hello', KEY));
  });

  it('emits the iv and payload separated by a colon', () => {
    expect(encrypt('hello', KEY).split(':')).toHaveLength(2);
  });

  it('fails to decrypt with the wrong key', () => {
    expect(() => decrypt(encrypt('hello', KEY), OTHER_KEY)).toThrow();
  });

  it('rejects cipher text without a separator', () => {
    expect(() => decrypt('not-a-cipher-text', KEY)).toThrow(/Malformed cipher text/);
  });

  it('requires a key when TOKEN_SECRET is unset', () => {
    const previous = process.env.TOKEN_SECRET;
    delete process.env.TOKEN_SECRET;
    try {
      expect(() => encrypt('hello')).toThrow(/TOKEN_SECRET/);
    } finally {
      if (previous !== undefined) process.env.TOKEN_SECRET = previous;
    }
  });

  it('falls back to TOKEN_SECRET when no key is passed', () => {
    const previous = process.env.TOKEN_SECRET;
    process.env.TOKEN_SECRET = KEY;
    try {
      expect(decrypt(encrypt('hello'))).toBe('hello');
    } finally {
      if (previous === undefined) delete process.env.TOKEN_SECRET;
      else process.env.TOKEN_SECRET = previous;
    }
  });
});
