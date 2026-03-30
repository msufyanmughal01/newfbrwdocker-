'use client';

// T038 [US4]: DashboardContent — client component for analytics with date filtering
// Initial data is fetched server-side (page.tsx) and passed as props.
// Client-side fetch only triggers when the user changes the date range.

import { useState, useEffect, useRef } from 'react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { RevenueTrendChart } from '@/components/dashboard/RevenueTrendChart';
import type { DashboardMetrics, TrendDataPoint } from '@/lib/analytics/dashboard-metrics';

interface DashboardContentProps {
  initialMetrics: DashboardMetrics;
  initialTrend: TrendDataPoint[];
  initialFrom: string;
  initialTo: string;
}

export function DashboardContent({
  initialMetrics,
  initialTrend,
  initialFrom,
  initialTo,
}: DashboardContentProps) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>(initialTrend);
  const [loading, setLoading] = useState(false);

  // Skip the initial useEffect — data is already loaded from the server.
  // Only fetch when the user interacts with the date picker.
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    async function fetchMetrics() {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard/metrics?from=${from}&to=${to}`);
        if (res.ok) {
          const data = await res.json();
          setMetrics(data.metrics);
          setTrendData(data.trendData);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [from, to]);

  function handleDateChange(newFrom: string, newTo: string) {
    if (newFrom > newTo) {
      setFrom(newTo);
      setTo(newFrom);
    } else {
      setFrom(newFrom);
      setTo(newTo);
    }
  }

  function formatCurrency(value: string) {
    const num = parseFloat(value);
    if (isNaN(num)) return '—';
    return `PKR ${num.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return (
    <div className="space-y-6">
      {/* Date Range Picker */}
      <div className="rounded-xl p-4 flex flex-wrap items-center gap-4 bg-[var(--surface)] border border-[var(--border)]">
        <span className="text-sm font-medium text-[var(--foreground-muted)]">
          Date Range:
        </span>
        <DateRangePicker from={from} to={to} onChange={handleDateChange} />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Invoices"
          value={metrics.totalInvoices.toString()}
          loading={loading}
          accentColor="#6366f1"
        />
        <MetricCard
          label="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          loading={loading}
          accentColor="#06b6d4"
        />
        <MetricCard
          label="Sales Tax"
          value={formatCurrency(metrics.totalSalesTax)}
          loading={loading}
          accentColor="#f59e0b"
        />
        <MetricCard
          label="Revenue (ex. Tax)"
          value={formatCurrency(metrics.revenueExcludingSalesTax)}
          loading={loading}
          accentColor="#10b981"
        />
      </div>

      {/* Revenue Trend Chart */}
      <div className="rounded-xl p-6 bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow)]">
        <h2 className="text-sm font-semibold mb-4 text-[var(--foreground)]">
          Revenue Trend
        </h2>
        {loading ? (
          <div className="h-48 flex items-center justify-center text-sm text-[var(--foreground-muted)]">
            Loading chart...
          </div>
        ) : (
          <RevenueTrendChart data={trendData} />
        )}
      </div>
    </div>
  );
}
