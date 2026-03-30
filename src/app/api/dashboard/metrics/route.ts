// T034 [US4]: GET /api/dashboard/metrics?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns aggregated invoice metrics for the given date range

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDashboardMetrics, getRevenueTrend } from '@/lib/analytics/dashboard-metrics';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json(
      { error: "Both 'from' and 'to' query parameters are required (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  // Validate ISO date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(from) || !dateRegex.test(to)) {
    return NextResponse.json(
      { error: 'Dates must be in YYYY-MM-DD format' },
      { status: 400 }
    );
  }

  if (from > to) {
    return NextResponse.json(
      { error: "'from' date must be before 'to' date" },
      { status: 400 }
    );
  }

  const [metrics, trendData] = await Promise.all([
    getDashboardMetrics(session.user.id, from, to),
    getRevenueTrend(session.user.id, from, to),
  ]);

  return NextResponse.json({ metrics, trendData, dateRange: { from, to } });
}
