'use client';

// DashboardContent — analytics, quick actions, recent invoices, FBR status

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { RevenueTrendChart } from '@/components/dashboard/RevenueTrendChart';
import { PlanBadge } from '@/components/dashboard/PlanBadge';
import { UsageBar } from '@/components/dashboard/UsageBar';
import type { DashboardMetrics, TrendDataPoint, RecentInvoice } from '@/lib/analytics/dashboard-metrics';

/* ─────────────────────────────────────────────────────────────── */
/*  Types                                                          */
/* ─────────────────────────────────────────────────────────────── */

interface PlanStatus {
  planSlug: string;
  planName: string;
  invoicesPerMonth: number | null;
  invoicesUsed: number;
  fbrEnvironment: string;
  limitReached: boolean;
}

interface SellerProfile {
  ntnCnic?: string | null;
  cnic?: string | null;
  businessCredentials?: Array<{ type: string; value: string; includeInInvoice: boolean }> | null;
  fbrTokenHint?: string | null;
  fbrEnvironment?: string | null;
}

interface DashboardContentProps {
  initialMetrics: DashboardMetrics;
  initialTrend: TrendDataPoint[];
  initialFrom: string;
  initialTo: string;
  planStatus: PlanStatus;
  recentInvoices: RecentInvoice[];
  sellerProfile?: SellerProfile | null;
}

/* ─────────────────────────────────────────────────────────────── */
/*  Status badge config                                            */
/* ─────────────────────────────────────────────────────────────── */

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  draft:      { label: 'Draft',      color: 'var(--foreground-subtle)', bg: 'var(--surface-3)' },
  validating: { label: 'Validating', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  validated:  { label: 'Validated',  color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  submitting: { label: 'Submitting', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  issued:     { label: 'Issued',     color: 'var(--positive)',    bg: 'var(--positive-bg)' },
  failed:     { label: 'Failed',     color: 'var(--error)',       bg: 'var(--error-bg)' },
};

/* ─────────────────────────────────────────────────────────────── */
/*  Invoice count chart (inline SVG)                              */
/* ─────────────────────────────────────────────────────────────── */

function InvoiceCountChart({ data }: { data: TrendDataPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-[var(--foreground-muted)] text-sm">
        No invoice data in the selected date range
      </div>
    );
  }

  const W = 560, H = 200;
  const pad = { top: 16, right: 16, bottom: 36, left: 44 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const maxCount = Math.max(...data.map(d => d.invoiceCount), 1);
  const n = data.length;

  const xOf = (i: number) => pad.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yOf = (v: number) => pad.top + innerH - (v / maxCount) * innerH;

  const linePoints = data.map((d, i) => `${xOf(i)},${yOf(d.invoiceCount)}`).join(' ');
  const areaPath = [
    `M ${xOf(0)} ${H - pad.bottom}`,
    ...data.map((d, i) => `L ${xOf(i)} ${yOf(d.invoiceCount)}`),
    `L ${xOf(n - 1)} ${H - pad.bottom}`,
    'Z',
  ].join(' ');

  const gridTicks = [0, 0.25, 0.5, 0.75, 1];
  const labelStep = Math.max(1, Math.ceil(n / 6));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: '180px', overflow: 'visible' }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="icGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridTicks.map(t => {
        const y = pad.top + innerH * (1 - t);
        const val = Math.round(maxCount * t);
        return (
          <g key={t}>
            <line x1={pad.left} y1={y} x2={W - pad.right} y2={y}
              stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
            <text x={pad.left - 6} y={y + 4} textAnchor="end"
              fontSize="10" fill="var(--foreground-muted)">{val}</text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#icGrad)" />
      <polyline points={linePoints} fill="none" stroke="#6366f1"
        strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <circle key={i} cx={xOf(i)} cy={yOf(d.invoiceCount)}
          r="4" fill="#6366f1" stroke="var(--surface)" strokeWidth="2" />
      ))}
      {data.map((d, i) => {
        if (i % labelStep !== 0 && i !== n - 1) return null;
        return (
          <text key={`xl-${i}`} x={xOf(i)} y={H - pad.bottom + 16}
            textAnchor="middle" fontSize="10" fill="var(--foreground-muted)">
            {d.date.length > 7 ? d.date.slice(5) : d.date}
          </text>
        );
      })}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Quick Actions                                                  */
/* ─────────────────────────────────────────────────────────────── */

function QuickActions({ limitReached }: { limitReached: boolean }) {
  const actions = [
    {
      href: '/invoices/new',
      label: 'New Invoice',
      sub: limitReached ? 'Limit reached' : 'Create FBR invoice',
      primary: true,
      disabled: limitReached,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="11" x2="12" y2="17"/>
          <line x1="9" y1="14" x2="15" y2="14"/>
        </svg>
      ),
    },
    {
      href: '/invoices',
      label: 'All Invoices',
      sub: 'Browse & manage',
      primary: false,
      disabled: false,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
      ),
    },
    {
      href: '/settings?tab=fbr',
      label: 'FBR Settings',
      sub: 'Token & environment',
      primary: false,
      disabled: false,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14"/>
        </svg>
      ),
    },
    {
      href: '/settings?tab=company',
      label: 'Company Profile',
      sub: 'Logo, address, bank',
      primary: false,
      disabled: false,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
      {actions.map(a => (
        <Link
          key={a.href}
          href={a.disabled ? '#' : a.href}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            borderRadius: '12px',
            textDecoration: 'none',
            border: `1.5px solid ${a.primary ? 'var(--primary)' : 'var(--border)'}`,
            background: a.primary ? 'var(--primary)' : 'var(--surface)',
            color: a.primary ? '#fff' : 'var(--foreground)',
            opacity: a.disabled ? 0.5 : 1,
            pointerEvents: a.disabled ? 'none' : 'auto',
            transition: 'transform 0.15s, box-shadow 0.15s',
            cursor: a.disabled ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={e => {
            if (!a.disabled) {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
            }
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = '';
            (e.currentTarget as HTMLElement).style.boxShadow = '';
          }}
        >
          <span style={{
            display: 'flex', flexShrink: 0,
            color: a.primary ? '#fff' : 'var(--primary)',
          }}>
            {a.icon}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {a.label}
            </div>
            <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {a.sub}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Recent Invoices                                                */
/* ─────────────────────────────────────────────────────────────── */

function RecentInvoices({ invoices }: { invoices: RecentInvoice[] }) {
  if (invoices.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px', gap: '12px',
        color: 'var(--foreground-muted)',
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        <p style={{ fontSize: '13px', margin: 0 }}>No invoices yet</p>
        <Link href="/invoices/new" style={{
          fontSize: '12px', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none',
        }}>
          Create your first invoice →
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {invoices.map((inv, idx) => {
        const meta = STATUS_META[inv.status] ?? STATUS_META.draft;
        const amount = parseFloat(inv.grandTotal);
        const amountStr = isNaN(amount)
          ? '—'
          : `PKR ${amount.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

        return (
          <Link
            key={inv.id}
            href={`/invoices`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 0',
              borderBottom: idx < invoices.length - 1 ? '1px solid var(--border)' : 'none',
              textDecoration: 'none',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
          >
            {/* Status dot */}
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: meta.color, flexShrink: 0,
            }} />

            {/* Buyer + type */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '13px', fontWeight: 600,
                color: 'var(--foreground)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {inv.buyerBusinessName}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--foreground-subtle)', marginTop: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{inv.invoiceType === 'Debit Note' ? 'Debit Note' : 'Sale Invoice'}</span>
                {inv.isSandbox && (
                  <span style={{
                    fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em',
                    background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
                    padding: '1px 5px', borderRadius: '4px',
                  }}>SANDBOX</span>
                )}
              </div>
            </div>

            {/* Date */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '11px', color: 'var(--foreground-muted)', fontWeight: 500 }}>
                {inv.invoiceDate}
              </div>
              {inv.fbrInvoiceNumber && (
                <div style={{ fontSize: '10px', color: 'var(--foreground-subtle)', marginTop: '1px' }}>
                  #{inv.fbrInvoiceNumber}
                </div>
              )}
            </div>

            {/* Amount */}
            <div style={{
              fontSize: '13px', fontWeight: 700,
              color: 'var(--foreground)', flexShrink: 0,
              minWidth: '90px', textAlign: 'right',
            }}>
              {amountStr}
            </div>

            {/* Status badge */}
            <span style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em',
              color: meta.color, background: meta.bg,
              padding: '3px 8px', borderRadius: '20px',
              flexShrink: 0, minWidth: '62px', textAlign: 'center',
            }}>
              {meta.label.toUpperCase()}
            </span>

            {/* Arrow */}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--foreground-subtle)"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  FBR Setup Status                                               */
/* ─────────────────────────────────────────────────────────────── */

function FBRStatusCard({ profile }: { profile?: SellerProfile | null }) {
  type CheckItem = { label: string; ok: boolean; detail: string };

  const strn = (profile?.businessCredentials ?? []).find(c => c.type === 'STRN')?.value;

  const checks: CheckItem[] = [
    {
      label: 'NTN',
      ok: !!profile?.ntnCnic,
      detail: profile?.ntnCnic ? 'Configured & encrypted' : 'Required for FBR submission',
    },
    {
      label: 'CNIC',
      ok: !!profile?.cnic,
      detail: profile?.cnic ? 'Configured & encrypted' : 'Owner CNIC for verification',
    },
    {
      label: 'STRN',
      ok: !!strn,
      detail: strn ? `${strn.slice(0, 4)}••••` : 'Sales Tax Reg. Number',
    },
    {
      label: 'API Token',
      ok: !!profile?.fbrTokenHint,
      detail: profile?.fbrTokenHint ? `••••${profile.fbrTokenHint}` : 'FBR auth token required',
    },
  ];

  const allOk = checks.every(c => c.ok);
  const missingCount = checks.filter(c => !c.ok).length;

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1.5px solid ${allOk ? 'var(--positive)' : 'var(--border)'}`,
      borderRadius: '12px',
      padding: '18px 20px',
      height: '100%',
      boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--primary)"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>FBR Setup</span>
        </div>
        {allOk ? (
          <span style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em',
            color: 'var(--positive)', background: 'var(--positive-bg)',
            padding: '3px 8px', borderRadius: '20px',
          }}>
            READY ✓
          </span>
        ) : (
          <span style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em',
            color: 'var(--warning)', background: 'var(--warning-bg)',
            padding: '3px 8px', borderRadius: '20px',
          }}>
            {missingCount} MISSING
          </span>
        )}
      </div>

      {/* Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {checks.map(c => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            {/* Icon */}
            <span style={{ flexShrink: 0, marginTop: '1px' }}>
              {c.ok ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--positive)"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" fill="var(--positive-bg)" stroke="var(--positive)"/>
                  <polyline points="20 6 9 17 4 12" stroke="var(--positive)"/>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--warning)"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" fill="var(--warning-bg)" stroke="var(--warning)"/>
                  <line x1="12" y1="8" x2="12" y2="12" stroke="var(--warning)"/>
                  <line x1="12" y1="16" x2="12.01" y2="16" stroke="var(--warning)"/>
                </svg>
              )}
            </span>
            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground)' }}>{c.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--foreground-muted)', marginTop: '1px' }}>{c.detail}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA if anything missing */}
      {!allOk && (
        <Link
          href="/settings?tab=fbr"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            marginTop: '16px', padding: '9px',
            background: 'var(--primary)', color: '#fff',
            borderRadius: '8px', textDecoration: 'none',
            fontSize: '12px', fontWeight: 700,
          }}
        >
          Complete FBR Setup
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </Link>
      )}

      {/* Environment indicator */}
      {profile?.fbrEnvironment && (
        <div style={{
          marginTop: allOk ? '14px' : '8px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '7px',
          fontSize: '11px', color: 'var(--foreground-muted)',
        }}>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
            background: profile.fbrEnvironment === 'production' ? 'var(--positive)' : '#f59e0b',
          }}/>
          {profile.fbrEnvironment === 'production' ? 'Production environment' : 'Sandbox environment — test mode'}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Main component                                                 */
/* ─────────────────────────────────────────────────────────────── */

export function DashboardContent({
  initialMetrics,
  initialTrend,
  initialFrom,
  initialTo,
  planStatus,
  recentInvoices,
  sellerProfile,
}: DashboardContentProps) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>(initialTrend);
  const [loading, setLoading] = useState(false);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const controller = new AbortController();
    async function fetchMetrics() {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard/metrics?from=${from}&to=${to}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setMetrics(data.metrics);
          setTrendData(data.trendData);
        }
      } catch (err) {
        // AbortError is expected when the date range changes before the
        // previous request completes — ignore it, don't clear loading state.
        if ((err as Error).name === 'AbortError') return;
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
    return () => controller.abort();
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

  const isStandardPlan = planStatus.planSlug === 'standard';
  const isSandbox = planStatus.fbrEnvironment === 'sandbox';

  return (
    <div className="space-y-5">

      {/* ── Quick Actions ─────────────────────────────────── */}
      <QuickActions limitReached={planStatus.limitReached} />

      {/* ── Plan Status Bar ───────────────────────────────── */}
      <div
        className="rounded-xl p-4 bg-[var(--surface)] border border-[var(--border)]"
        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}
      >
        <PlanBadge planSlug={planStatus.planSlug} />
        <div style={{ flex: 1, minWidth: '180px' }}>
          <UsageBar used={planStatus.invoicesUsed} limit={planStatus.invoicesPerMonth} />
        </div>
        <span
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            background: isSandbox ? 'var(--warning-bg)' : 'var(--positive-bg)',
            color: isSandbox ? 'var(--warning)' : 'var(--positive)',
            border: `1.5px solid ${isSandbox ? 'var(--warning)' : 'var(--positive)'}`,
            borderRadius: '20px', padding: '3px 12px',
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap',
          }}
        >
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: isSandbox ? 'var(--warning)' : 'var(--positive)', display: 'inline-block',
          }} />
          {isSandbox ? 'SANDBOX' : 'PRODUCTION'}
        </span>
        {planStatus.limitReached && (
          <Link href="/settings?tab=billing" style={{
            fontSize: '12px', fontWeight: 700, color: 'var(--error)',
            background: 'var(--error-bg)', border: '1px solid var(--error)',
            borderRadius: '20px', padding: '3px 12px', textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            Limit reached — Upgrade
          </Link>
        )}
      </div>

      {/* ── Upgrade Banner ────────────────────────────────── */}
      {isStandardPlan && (
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
          borderRadius: '12px', padding: '16px 20px',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center',
          justifyContent: 'space-between', gap: '12px',
        }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>
              You&apos;re on the free Standard plan (3 invoices/month)
            </div>
            <div style={{ color: '#bfdbfe', fontSize: '13px', marginTop: '2px' }}>
              Upgrade to Growth for Rs 5,000/mo — 20 invoices/month + team access
            </div>
          </div>
          <Link href="/settings?tab=billing" style={{
            background: '#fff', color: '#1d4ed8', fontWeight: 700,
            fontSize: '13px', padding: '8px 18px', borderRadius: '8px',
            textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            Upgrade Plan →
          </Link>
        </div>
      )}

      {/* ── Date Range Picker ─────────────────────────────── */}
      <div className="rounded-xl p-4 flex flex-wrap items-center gap-4 bg-[var(--surface)] border border-[var(--border)]">
        <span className="text-sm font-medium text-[var(--foreground-muted)]">Date Range:</span>
        <DateRangePicker from={from} to={to} onChange={handleDateChange} />
      </div>

      {/* ── Metric Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Invoices"
          value={metrics.totalInvoices.toString()}
          loading={loading}
          accentColor="#6366f1"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          }
        />
        <MetricCard
          label="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          loading={loading}
          accentColor="#06b6d4"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          }
        />
        <MetricCard
          label="Sales Tax"
          value={formatCurrency(metrics.totalSalesTax)}
          loading={loading}
          accentColor="#f59e0b"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 14l6-6"/><circle cx="9.5" cy="9.5" r="1.5" fill="currentColor"/>
              <circle cx="14.5" cy="14.5" r="1.5" fill="currentColor"/>
              <rect x="3" y="3" width="18" height="18" rx="3"/>
            </svg>
          }
        />
        <MetricCard
          label="Revenue (ex. Tax)"
          value={formatCurrency(metrics.revenueExcludingSalesTax)}
          loading={loading}
          accentColor="#10b981"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
              <polyline points="16 7 22 7 22 13"/>
            </svg>
          }
        />
      </div>

      {/* ── Recent Invoices + FBR Status ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

        {/* Recent Invoices — takes 2/3 on large screens */}
        <div
          className="lg:col-span-2"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--primary)"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <h2 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
                Recent Invoices
              </h2>
            </div>
            <Link href="/invoices" style={{
              fontSize: '12px', color: 'var(--primary)', fontWeight: 600,
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px',
            }}>
              View all
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>
          </div>
          <RecentInvoices invoices={recentInvoices} />
        </div>

        {/* FBR Setup Status */}
        <div className="lg:col-span-1">
          <FBRStatusCard profile={sellerProfile} />
        </div>

      </div>

      {/* ── Charts Row ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-6 bg-[var(--surface)] border border-[var(--border)]">
          <h2 className="text-sm font-semibold mb-4 text-[var(--foreground)]">Revenue Trend</h2>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-sm text-[var(--foreground-muted)]">
              Loading chart…
            </div>
          ) : (
            <RevenueTrendChart data={trendData} />
          )}
        </div>
        <div className="rounded-xl p-6 bg-[var(--surface)] border border-[var(--border)]">
          <h2 className="text-sm font-semibold mb-4 text-[var(--foreground)]">Invoice Count</h2>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-sm text-[var(--foreground-muted)]">
              Loading chart…
            </div>
          ) : (
            <InvoiceCountChart data={trendData} />
          )}
        </div>
      </div>

    </div>
  );
}
