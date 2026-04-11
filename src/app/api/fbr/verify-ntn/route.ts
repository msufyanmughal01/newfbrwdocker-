// POST /api/fbr/verify-ntn
// Verifies buyer NTN/CNIC via STATL API. Results cached per NTN for 24 hours.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { verifyNTN } from '@/lib/fbr/reference/statl';

// ── Per-user rate limit ───────────────────────────────────────────────────────
// Prevents a single user from enumerating valid NTNs via the STATL API.
// 60 lookups per hour per user (cached hits don't count against STATL).
interface UserRateEntry { count: number; resetAt: number }
const userNtnStore = new Map<string, UserRateEntry>();
const USER_MAX    = 60;
const USER_WIN_MS = 60 * 60_000; // 1 hour

setInterval(() => {
  const now = Date.now();
  for (const [id, rec] of userNtnStore.entries()) {
    if (now >= rec.resetAt) userNtnStore.delete(id);
  }
}, 15 * 60_000); // prune every 15 minutes

function checkUserLimit(userId: string): boolean {
  const now = Date.now();
  const rec = userNtnStore.get(userId);
  if (!rec || now >= rec.resetAt) {
    userNtnStore.set(userId, { count: 1, resetAt: now + USER_WIN_MS });
    return true;
  }
  if (rec.count >= USER_MAX) return false;
  rec.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  if (!checkUserLimit(userId)) {
    return NextResponse.json(
      { error: 'Too many NTN lookups. Limit is 60 per hour.' },
      { status: 429, headers: { 'Retry-After': '3600' } }
    );
  }

  try {
    const body = await request.json();
    const { ntnCnic } = body as { ntnCnic: string };

    if (!ntnCnic || ntnCnic.trim().length < 7) {
      return NextResponse.json(
        { error: 'ntnCnic must be at least 7 characters' },
        { status: 400 }
      );
    }

    const result = await verifyNTN(ntnCnic.trim(), userId);

    return NextResponse.json({
      ntnCnic: result.ntnCnic,
      statlStatus: result.statlStatus,
      registrationType: result.registrationType,
      cached: result.cached,
      checkedAt: result.checkedAt.toISOString(),
      ...(result.warning ? { warning: result.warning } : {}),
    });
  } catch (err) {
    console.error('NTN verify error:', err);
    return NextResponse.json(
      {
        statlStatus: 'unknown',
        warning: 'Could not verify NTN — STATL API unavailable. Proceed manually.',
      },
      { status: 504 }
    );
  }
}
