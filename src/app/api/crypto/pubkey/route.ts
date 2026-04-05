import { NextResponse } from 'next/server';
import { getServerPublicKeyJwk } from '@/lib/crypto/transit-server';

/**
 * GET /api/crypto/pubkey
 * Returns the server's ECDH P-256 public key as JWK.
 * Clients use this to encrypt payloads before sending — the private key never leaves the server.
 */
export async function GET() {
  const jwk = getServerPublicKeyJwk();
  return NextResponse.json(jwk, {
    headers: {
      // Safe to cache — public key only, no secret material
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
