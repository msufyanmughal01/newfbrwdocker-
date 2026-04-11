// POST /api/admin/log-payment
// Records a manual payment confirmation when admin upgrades a user's plan.

import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest } from '../_admin-auth';
import { db } from '@/lib/db';
import { adminPaymentLogs } from '@/lib/db/schema/admin-payment-logs';
import { businessProfiles } from '@/lib/db/schema/business-profiles';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  if (!validateAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { userId, paidAt, amount, planSlug, durationMonths, notes } = body as {
    userId: string;
    paidAt: string;
    amount: number;
    planSlug: string;
    durationMonths?: number;
    notes?: string;
  };

  if (!userId || !paidAt || !amount || !planSlug) {
    return NextResponse.json(
      { error: 'userId, paidAt, amount, and planSlug are required' },
      { status: 400 }
    );
  }

  const parsedDate = new Date(paidAt);
  if (isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: 'Invalid paidAt date' }, { status: 400 });
  }

  await db.insert(adminPaymentLogs).values({
    userId,
    paidAt: parsedDate,
    amount: Math.round(amount),
    planSlug,
    durationMonths: durationMonths ?? 1,
    notes: notes?.trim() || null,
  });

  // Actually upgrade the user's plan in businessProfiles
  await db
    .update(businessProfiles)
    .set({
      planSlug,
      planActivatedAt: parsedDate,
      billingCycleStart: parsedDate,
      updatedAt: new Date(),
    })
    .where(eq(businessProfiles.userId, userId));

  return NextResponse.json({ success: true });
}
