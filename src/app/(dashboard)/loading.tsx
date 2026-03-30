export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      {/* Page title skeleton */}
      <div className="space-y-2">
        <div
          className="h-7 w-48 rounded-lg"
          style={{ background: "var(--surface-3)" }}
        />
        <div
          className="h-4 w-72 rounded-md"
          style={{ background: "var(--surface-2)" }}
        />
      </div>

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-6 border border-[var(--border)] space-y-3"
            style={{ background: "var(--surface)" }}
          >
            <div
              className="h-3 w-24 rounded"
              style={{ background: "var(--surface-3)" }}
            />
            <div
              className="h-8 w-32 rounded-lg"
              style={{ background: "var(--surface-3)" }}
            />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div
        className="rounded-xl p-6 border border-[var(--border)]"
        style={{ background: "var(--surface)" }}
      >
        <div
          className="h-4 w-32 rounded mb-4"
          style={{ background: "var(--surface-3)" }}
        />
        <div
          className="h-48 rounded-lg"
          style={{ background: "var(--surface-2)" }}
        />
      </div>
    </div>
  );
}
