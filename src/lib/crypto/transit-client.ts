'use client';
/**
 * Client-side (browser) ECDH + AES-256-GCM transit encryption.
 *
 * Every call generates a fresh ephemeral P-256 keypair so each request
 * has a unique shared secret — forward secrecy per request.
 *
 * Key derivation uses HKDF-SHA-256 (RFC 5869) to match transit-server.ts.
 *
 * Usage:
 *   import { encryptedPost } from '@/lib/crypto/transit-client';
 *   const res = await encryptedPost('/api/invoices', formData);
 */

import type { TransitPayload } from './transit-server';

// Cache the server public key for the session (1 fetch per page load)
let _serverPubKey: CryptoKey | null = null;

async function getServerKey(): Promise<CryptoKey> {
  if (_serverPubKey) return _serverPubKey;
  const res = await fetch('/api/crypto/pubkey');
  if (!res.ok) throw new Error('Failed to fetch server public key');
  const jwk = (await res.json()) as JsonWebKey;
  _serverPubKey = await crypto.subtle.importKey(
    'jwk', jwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false, [] // public key — no key_ops needed
  );
  return _serverPubKey;
}

/**
 * Encrypt data with the server's public key.
 * Returns a TransitPayload ready to be sent as JSON.
 */
export async function encryptPayload(data: unknown): Promise<TransitPayload> {
  const serverKey = await getServerKey();

  // Ephemeral client keypair — fresh per request (forward secrecy)
  const clientKP = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  // ECDH: shared secret = x-coordinate of (serverPub * clientPriv)
  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: serverKey },
    clientKP.privateKey,
    256 // P-256 gives 32 bytes
  );

  // Key derivation: HKDF-SHA-256 with empty salt and fixed info string.
  // Must match the server-side hkdfSync call in transit-server.ts.
  const keyMaterial = await crypto.subtle.importKey(
    'raw', sharedBits, 'HKDF', false, ['deriveKey']
  );
  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(0),                          // empty salt (RFC 5869 §2.2)
      info: new TextEncoder().encode('ECDH-AES-256-GCM'), // domain separation
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // Encrypt — WebCrypto output = ciphertext ‖ authTag (16 bytes appended)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plainBuf = new TextEncoder().encode(JSON.stringify(data));
  const cipherWithTag = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, plainBuf);

  // Export client ephemeral public key as JWK
  const epkJwk = await crypto.subtle.exportKey('jwk', clientKP.publicKey);

  // Safe base64url encode — avoids spread-into-function stack overflow on large buffers
  const toB64url = (buf: ArrayBuffer | Uint8Array): string => {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  return {
    c: toB64url(cipherWithTag),
    iv: toB64url(iv),
    epk: {
      kty: epkJwk.kty!,
      crv: epkJwk.crv!,
      x: epkJwk.x!,
      y: epkJwk.y!,
    },
  };
}

/**
 * POST data to an API route with application-level ECDH encryption.
 * The server must use decryptTransitPayload() to read the body.
 */
export async function encryptedPost(
  url: string,
  data: unknown,
  options?: Omit<RequestInit, 'method' | 'body'>
): Promise<Response> {
  const payload = await encryptPayload(data);
  return fetch(url, {
    ...options,
    method: 'POST',
    headers: {
      ...(options?.headers ?? {}),
      'Content-Type': 'application/json',
      'X-Encrypted': '1',
    },
    body: JSON.stringify(payload),
  });
}

/**
 * PUT data to an API route with application-level ECDH encryption.
 */
export async function encryptedPut(
  url: string,
  data: unknown,
  options?: Omit<RequestInit, 'method' | 'body'>
): Promise<Response> {
  const payload = await encryptPayload(data);
  return fetch(url, {
    ...options,
    method: 'PUT',
    headers: {
      ...(options?.headers ?? {}),
      'Content-Type': 'application/json',
      'X-Encrypted': '1',
    },
    body: JSON.stringify(payload),
  });
}
