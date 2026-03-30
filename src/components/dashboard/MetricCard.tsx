'use client';

interface MetricCardProps {
  label: string;
  value: string;
  subLabel?: string;
  loading?: boolean;
  icon?: React.ReactNode;
  accentColor?: string;
}

export function MetricCard({
  label,
  value,
  subLabel,
  loading = false,
  icon,
  accentColor = "#6366f1",
}: MetricCardProps) {
  return (
    <div
      className="relative rounded-xl p-6 border border-[var(--border)] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]"
      style={{
        background: "var(--surface)",
        boxShadow: "var(--shadow)",
      }}
    >
      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 inset-x-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            {label}
          </p>
          {loading ? (
            <div
              className="mt-3 h-8 w-32 rounded-lg animate-pulse"
              style={{ background: "var(--surface-3)" }}
            />
          ) : (
            <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">
              {value === "0.00" || value === "0" ? "—" : value}
            </p>
          )}
          {subLabel && (
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">
              {subLabel}
            </p>
          )}
        </div>

        {icon && (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white"
            style={{ background: accentColor }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
