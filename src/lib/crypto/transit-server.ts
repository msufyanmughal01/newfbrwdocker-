/**
 * Server-side ECDH + AES-256-GCM transit decryption.
 *
 * Flow:
 *  1. Client fetches server P-256 public key from /api/crypto/pubkey
 *  2. Client generates ephemeral keypair, does ECDH → derives AES key via HKDF
 *  3. Client encrypts payload, sends { c, iv, epk } to API route
 *  4. Server uses its private key + client ephemeral public key → same AES key → decrypt
 *
 * Server private key stored in ECDH_PRIVATE_KEY_HEX env var (32 bytes hex).
 * Generate:  node -e "const {createECDH}=require('crypto');const e=createECDH('prime256v1');e.generateKeys();console.log(e.getPrivateKey('hex'))"
 */

import { createECDH, createDecipheriv, hkdfSync } from 'node:crypto';

export interface TransitPayload {
  /** base64url — AES-256-GCM ciphertext with 16-byte auth tag appended (WebCrypto format) */
  c: string;
  /** base64url — 12-byte AES-GCM IV */
  iv: string;
  /** Client's ephemeral P-256 public key as JWK */
  epk: { kty: string; crv: string; x: string; y: string };
}

// Cached ECDH instance (private key set once at startup)
let _ecdh: ReturnType<typeof createECDH> | null = null;
let _pubKeyJwk: { kty: string; crv: string; x: string; y: string } | null = null;

function getServerECDH() {
  if (_ecdh) return { ecdh: _ecdh, pubKeyJwk: _pubKeyJwk! };

  _ecdh = createECDH('prime256v1'); // P-256

  const privHex = process.env.ECDH_PRIVATE_KEY_HEX;
  if (privHex) {
    _ecdh.setPrivateKey(Buffer.from(privHex, 'hex'));
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[crypto] ECDH_PRIVATE_KEY_HEX must be set in production. ' +
        "Generate with: node -e \"const {createECDH}=require('crypto');const e=createECDH('prime256v1');e.generateKeys();console.log(e.getPrivateKey('hex'))\""
      );
    }
    // Development only — ephemeral key (rotates on restart, fine for local dev)
    _ecdh.generateKeys();
    console.warn(
      '[crypto] ECDH_PRIVATE_KEY_HEX is not set — using an ephemeral key (dev only). ' +
      'Set this variable before deploying to production.'
    );
  }

  // Build public key JWK from the uncompressed public key (0x04 | x | y)
  const pub = _ecdh.getPublicKey(); // 65 bytes: 0x04 + x(32) + y(32)
  _pubKeyJwk = {
    kty: 'EC',
    crv: 'P-256',
    x: pub.subarray(1, 33).toString('base64url'),
    y: pub.subarray(33, 65).toString('base64url'),
  };

  return { ecdh: _ecdh, pubKeyJwk: _pubKeyJwk };
}

/** Returns the server's ECDH public key as JWK (safe to expose publicly). */
export function getServerPublicKeyJwk() {
  return getServerECDH().pubKeyJwk;
}

/**
 * Decrypt a transit-encrypted payload sent by the client.
 * Throws on tampered or malformed payloads (AES-GCM auth tag failure).
 */
export function decryptTransitPayload<T = unknown>(payload: TransitPayload): T {
  const { ecdh } = getServerECDH();

  // Convert client's JWK ephemeral public key → uncompressed point buffer
  const x = Buffer.from(payload.epk.x, 'base64url');
  const y = Buffer.from(payload.epk.y, 'base64url');
  const clientPubBuf = Buffer.concat([Buffer.from([0x04]), x, y]); // 65 bytes

  // ECDH: shared secret = x-coordinate of (clientPub * serverPriv)
  const sharedSecret = ecdh.computeSecret(clientPubBuf); // 32 bytes for P-256

  // Key derivation: HKDF-SHA-256 with empty salt and a fixed info string.
  // RFC 5869: empty salt is equivalent to HMAC with all-zero salt key.
  // The info string provides domain separation from any other HKDF usage.
  const aesKey = Buffer.from(
    hkdfSync('sha256', sharedSecret, Buffer.alloc(0), 'ECDH-AES-256-GCM', 32)
  );

  // Decrypt — WebCrypto AES-GCM output = ciphertext ‖ authTag (last 16 bytes)
  const cipherWithTag = Buffer.from(payload.c, 'base64url');
  const iv = Buffer.from(payload.iv, 'base64url');
  const ciphertext = cipherWithTag.subarray(0, -16);
  const authTag = cipherWithTag.subarray(-16);

  const decipher = createDecipheriv('aes-256-gcm', aesKey, iv);
  decipher.setAuthTag(authTag);
  const plain = decipher.update(ciphertext).toString('utf8') + decipher.final('utf8');

  return JSON.parse(plain) as T;
}
