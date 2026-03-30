// T033 [US4]: Dashboard metrics aggregation service
// On-demand SQL aggregation — no materialized views (constitution: simplicity)

import { db } from '@/lib/db';
import { invoices } from '@/lib/db/schema/invoices';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export interface DashboardMetrics {
  totalInvoices: number;
  totalRevenue: string;        // grandTotal sum as decimal string
  totalSalesTax: string;       // totalTax sum as decimal string
  revenueExcludingSalesTax: string; // subtotal sum as decimal string
}

export interface TrendDataPoint {
  date: string;       // YYYY-MM-DD or YYYY-MM depending on range
  invoiceCount: number;
  revenue: string;
}

/**
 * Compute aggregate metrics for issued invoices in the given date range.
 */
export async function getDashboardMetrics(
  userId: string,
  from: string,
  to: string
): Promise<DashboardMetrics> {
  const result = await db
    .select({
      totalInvoices: sql<number>`COUNT(*)::int`,
      totalRevenue: sql<string>`COALESCE(SUM(grand_total), 0)::text`,
      totalSalesTax: sql<string>`COALESCE(SUM(total_tax), 0)::text`,
      revenueExcludingSalesTax: sql<string>`COALESCE(SUM(subtotal), 0)::text`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.userId, userId),
        eq(invoices.status, 'issued'),
        gte(invoices.invoiceDate, from),
        lte(invoices.invoiceDate, to)
      )
    );

  const row = result[0];
  return {
    totalInvoices: row?.totalInvoices ?? 0,
    totalRevenue: row?.totalRevenue ?? '0.00',
    totalSalesTax: row?.totalSalesTax ?? '0.00',
    revenueExcludingSalesTax: row?.revenueExcludingSalesTax ?? '0.00',
  };
}

/**
 * Compute revenue trend data for the given date range.
 * Groups by week if range ≤90 days, by month if >90 days.
 */
export async function getRevenueTrend(
  userId: string,
  from: string,
  to: string
): Promise<TrendDataPoint[]> {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const diffDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

  // Choose grouping format
  // dateFormat reserved for future grouping use
  // const dateFormat = diffDays <= 90 ? 'IYYY-IW' : 'YYYY-MM';
  const dateLabel = diffDays <= 90 ? 'YYYY-MM-DD' : 'YYYY-MM';

  const result = await db
    .select({
      period: sql<string>`TO_CHAR(DATE_TRUNC(${diffDays <= 90 ? sql`'week'` : sql`'month'`}, invoice_date::date), ${dateLabel})`,
      invoiceCount: sql<number>`COUNT(*)::int`,
      revenue: sql<string>`COALESCE(SUM(grand_total), 0)::text`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.userId, userId),
        eq(invoices.status, 'issued'),
        gte(invoices.invoiceDate, from),
        lte(invoices.invoiceDate, to)
      )
    )
    .groupBy(sql`DATE_TRUNC(${diffDays <= 90 ? sql`'week'` : sql`'month'`}, invoice_date::date)`)
    .orderBy(sql`DATE_TRUNC(${diffDays <= 90 ? sql`'week'` : sql`'month'`}, invoice_date::date)`);

  return result.map((row) => ({
    date: row.period,
    invoiceCount: row.invoiceCount,
    revenue: row.revenue,
  }));
}
