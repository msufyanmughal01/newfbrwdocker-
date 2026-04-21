// Shared quota utility — computes billing cycle usage for a user
// Used by: POST /api/invoices, GET /api/dashboard/plan-status, Settings Billing tab

import { db } from '@/lib/db';
import { businessProfiles } from '@/lib/db/schema/business-profiles';
import { invoices } from '@/lib/db/schema/invoices';
import { getPlan } from './plans';
import { eq, and, gte, sql } from 'drizzle-orm';

export interface QuotaStatus {
  planSlug: string;
  planName: string;
  monthlyPrice: number | null;
  invoicesPerMonth: number | null;
  invoicesUsed: number;
  cycleStart: Date;
  billingCycleStart: Date | null;
  fbrEnvironment: string;
  limitReached: boolean;
}

/**
 * Compute the start of the current billing cycle window.
 *
 * If billingCycleStart is set (e.g. the 15th of a past month),
 * we anchor the window to that same day-of-month each month.
 * If today is before that day, we go back one month.
 *
 * Falls back to the 1st of the current month if billingCycleStart is null.
 */
export function computeCycleStart(billingCycleStart: Date | null): Date {
  if (!billingCycleStart) {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  }

  const today = new Date();
  const anchorDay = billingCycleStart.getDate();

  let cycleStart = new Date(today.getFullYear(), today.getMonth(), anchorDay, 0, 0, 0, 0);

  // If the anchor hasn't arrived this month yet, use last month's anchor
  if (cycleStart > today) {
    cycleStart = new Date(today.getFullYear(), today.getMonth() - 1, anchorDay, 0, 0, 0, 0);
  }

  return cycleStart;
}

/**
 * Fetch the current quota status for a user.
 * Returns plan info, invoice usage, billing cycle start, and FBR environment.
 */
export async function getQuotaStatus(userId: string): Promise<QuotaStatus> {
  const profileRows = await db
    .select({
      planSlug: businessProfiles.planSlug,
      billingCycleStart: businessProfiles.billingCycleStart,
      fbrEnvironment: businessProfiles.fbrEnvironment,
    })
    .from(businessProfiles)
    .where(eq(businessProfiles.userId, userId))
    .limit(1);

  const profile = profileRows[0];
  const planSlug = profile?.planSlug ?? 'standard';
  const plan = getPlan(planSlug);
  const billingCycleStart = profile?.billingCycleStart ?? null;
  const fbrEnvironment = profile?.fbrEnvironment ?? 'sandbox';
  const cycleStart = computeCycleStart(billingCycleStart);

  let invoicesUsed = 0;

  if (plan.invoicesPerMonth !== null) {
    const [{ count }] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(invoices)
      .where(and(
        eq(invoices.userId, userId),
        eq(invoices.isSandbox, false),
        gte(invoices.createdAt, cycleStart),
      ));

    invoicesUsed = count;
  }

  return {
    planSlug: plan.slug,
    planName: plan.name,
    monthlyPrice: plan.monthlyPrice,
    invoicesPerMonth: plan.invoicesPerMonth,
    invoicesUsed,
    cycleStart,
    billingCycleStart,
    fbrEnvironment,
    limitReached: plan.invoicesPerMonth !== null && invoicesUsed >= plan.invoicesPerMonth,
  };
}
