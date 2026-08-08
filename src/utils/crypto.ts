import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

/**
 * Resolves the encryption key, preferring an explicitly passed one.
 * Validated lazily so a missing TOKEN_SECRET fails at call time with a clear
 * message instead of silently encrypting with `undefined`.
 */
function resolveKey(key: string | undefined): string {
  const resolved = key ?? process.env.TOKEN_SECRET;
  if (!resolved) {
    throw new Error('TOKEN_SECRET environment variable is required');
  }
  return resolved;
}

function encrypt(plaintext: string, key?: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, resolveKey(key), iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  return iv.toString('base64') + ':' + encrypted;
}

function decrypt(cipherText: string, key?: string): string {
  const [ivBase64, encrypted] = cipherText.split(':');
  if (ivBase64 === undefined || encrypted === undefined) {
    throw new Error('Malformed cipher text: expected "<iv>:<payload>"');
  }

  const iv = Buffer.from(ivBase64, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, resolveKey(key), iv);
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export { encrypt, decrypt };
