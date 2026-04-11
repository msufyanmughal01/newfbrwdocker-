// GET /api/dashboard/plan-status
// Returns the current user's plan, invoice usage for the current billing cycle,
// and FBR environment setting.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getQuotaStatus } from '@/lib/subscriptions/quota';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const quota = await getQuotaStatus(session.user.id);

  return NextResponse.json({
    planSlug: quota.planSlug,
    planName: quota.planName,
    monthlyPrice: quota.monthlyPrice,
    invoicesPerMonth: quota.invoicesPerMonth,
    invoicesUsed: quota.invoicesUsed,
    cycleStart: quota.cycleStart.toISOString(),
    billingCycleStart: quota.billingCycleStart?.toISOString() ?? null,
    fbrEnvironment: quota.fbrEnvironment,
    limitReached: quota.limitReached,
  });
}
