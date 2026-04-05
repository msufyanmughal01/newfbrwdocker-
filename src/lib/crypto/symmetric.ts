/**
 * AES-256-GCM symmetric encryption for sensitive data at rest.
 *
 * Requires ENCRYPTION_KEY env var: 64 hex chars (32 bytes).
 * Generate with:  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * Stored format: "aes256gcm:<iv_b64url>:<authTag_b64url>:<ciphertext_b64url>"
 * Legacy plain-text values (no prefix) are still readable — migration is automatic.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const PREFIX = 'aes256gcm:';

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) throw new Error('ENCRYPTION_KEY is not set. Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  const buf = Buffer.from(hex, 'hex');
  if (buf.length !== 32) throw new Error('ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)');
  return buf;
}

/** Encrypt a string. Returns a prefixed string safe to store in any text column. */
export function encryptData(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12); // 96-bit IV for AES-GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag(); // 16-byte GCM authentication tag
  return `${PREFIX}${iv.toString('base64url')}:${authTag.toString('base64url')}:${encrypted.toString('base64url')}`;
}

/**
 * Decrypt a value stored by encryptData.
 * If the value has no prefix (legacy plain text), returns it unchanged.
 * This lets existing rows continue to work until they are re-encrypted.
 */
export function decryptData(stored: string): string {
  if (!stored.startsWith(PREFIX)) return stored; // legacy plain text — pass through

  const rest = stored.slice(PREFIX.length);
  const parts = rest.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted value format');

  const [ivB64, authTagB64, cipherB64] = parts;
  const iv = Buffer.from(ivB64, 'base64url');
  const authTag = Buffer.from(authTagB64, 'base64url');
  const ciphertext = Buffer.from(cipherB64, 'base64url');

  const key = getKey();
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext).toString('utf8') + decipher.final('utf8');
}

/** True if the value was encrypted by encryptData, false if it's legacy plain text. */
export function isEncrypted(stored: string): boolean {
  return stored.startsWith(PREFIX);
}
