/**
 * withDecryption — HOC for Next.js API route handlers.
 *
 * Wraps a route handler so it automatically decrypts bodies sent
 * by encryptedPost() / encryptedPut() on the client.
 *
 * If the request has the X-Encrypted: 1 header the body is decrypted with
 * ECDH + AES-256-GCM before being passed to the handler.
 * Plain (unencrypted) requests are passed through unchanged for backwards
 * compatibility during rollout.
 *
 * Usage:
 *   export const POST = withDecryption(async (req, body) => {
 *     const { buyerName } = body as { buyerName: string };
 *     ...
 *     return NextResponse.json({ ok: true });
 *   });
 */

import { NextRequest, NextResponse } from 'next/server';
import { decryptTransitPayload, type TransitPayload } from './transit-server';

// Next.js 15 passes params as a Promise in route handlers
type NextRouteContext = { params: Promise<Record<string, string>> };

type DecryptedHandler = (
  req: NextRequest,
  body: unknown,
  ctx?: NextRouteContext
) => Promise<NextResponse>;

export function withDecryption(handler: DecryptedHandler) {
  return async (
    req: NextRequest,
    ctx?: NextRouteContext
  ): Promise<NextResponse> => {
    const isEncrypted = req.headers.get('X-Encrypted') === '1';
    let body: unknown;

    try {
      const raw = await req.json();
      body = isEncrypted ? decryptTransitPayload(raw as TransitPayload) : raw;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid request body';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return handler(req, body, ctx);
  };
}
