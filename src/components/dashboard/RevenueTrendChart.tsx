'use client';

// T037 [US4]: RevenueTrendChart — Recharts bar chart for revenue trend

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TrendDataPoint {
  date: string;
  invoiceCount: number;
  revenue: string;
}

interface RevenueTrendChartProps {
  data: TrendDataPoint[];
}

function formatRevenue(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-[var(--foreground-muted)] text-sm">
        No invoice data in the selected date range
      </div>
    );
  }

  const chartData = data.map((d) => ({
    date: d.date,
    revenue: parseFloat(d.revenue),
    invoices: d.invoiceCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: 'var(--foreground-muted)' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={formatRevenue}
          tick={{ fontSize: 11, fill: 'var(--foreground-muted)' }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip
          formatter={(value) => [`PKR ${Number(value ?? 0).toLocaleString()}`, 'Revenue']}
          labelStyle={{ fontSize: 12 }}
          contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
        />
        <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
