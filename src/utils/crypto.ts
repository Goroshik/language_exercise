import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const TOKEN_ENCRYPTION_KEY = process.env.TOKEN_SECRET as string;

function encrypt(plaintext: string, key: string = TOKEN_ENCRYPTION_KEY): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  return iv.toString('base64') + ':' + encrypted;
}

function decrypt(cipherText: string, key: string = TOKEN_ENCRYPTION_KEY): string {
  const [ivBase64, encrypted] = cipherText.split(':');
  const iv = Buffer.from(ivBase64, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export { encrypt, decrypt };
