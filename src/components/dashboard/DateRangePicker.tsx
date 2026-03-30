'use client';

// T036 [US4]: DateRangePicker — from/to date inputs for dashboard filtering

interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

export function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  function handleFromChange(newFrom: string) {
    if (newFrom > to) return; // prevent invalid range
    onChange(newFrom, to);
  }

  function handleToChange(newTo: string) {
    if (newTo < from) return; // prevent invalid range
    onChange(from, newTo);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label htmlFor="date-from" className="text-sm font-medium text-[var(--foreground-muted)] whitespace-nowrap">
          From
        </label>
        <input
          id="date-from"
          type="date"
          value={from}
          max={to}
          onChange={(e) => handleFromChange(e.target.value)}
          className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors"
        />
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="date-to" className="text-sm font-medium text-[var(--foreground-muted)] whitespace-nowrap">
          To
        </label>
        <input
          id="date-to"
          type="date"
          value={to}
          min={from}
          onChange={(e) => handleToChange(e.target.value)}
          className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors"
        />
      </div>
    </div>
  );
}
