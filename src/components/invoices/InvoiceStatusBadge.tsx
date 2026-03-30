// Reusable invoice status badge component

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  validating: 'Validating',
  validated: 'Validated',
  submitting: 'Submitting',
  issued: 'Issued',
  failed: 'Failed',
};

type StatusVariant = 'draft' | 'validating' | 'validated' | 'submitting' | 'issued' | 'failed';

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  draft:      { bg: 'bg-[var(--surface-3)]',    text: 'text-[var(--foreground-muted)]', dot: 'bg-[var(--foreground-subtle)]' },
  validating: { bg: 'bg-[var(--info-bg)]',       text: 'text-[var(--info)]',             dot: 'bg-[var(--info)]' },
  validated:  { bg: 'bg-[var(--positive-bg)]',   text: 'text-[var(--positive)]',         dot: 'bg-[var(--positive)]' },
  submitting: { bg: 'bg-[var(--info-bg)]',       text: 'text-[var(--info)]',             dot: 'bg-[var(--info)]' },
  issued:     { bg: 'bg-[var(--positive-bg)]',   text: 'text-[var(--positive)]',         dot: 'bg-[var(--positive)]' },
  failed:     { bg: 'bg-[var(--error-bg)]',      text: 'text-[var(--error)]',            dot: 'bg-[var(--error)]' },
};

interface InvoiceStatusBadgeProps {
  status: string;
  className?: string;
}

export function InvoiceStatusBadge({ status, className = '' }: InvoiceStatusBadgeProps) {
  const label = STATUS_LABELS[status] ?? status;
  const styles = STATUS_STYLES[status as StatusVariant] ?? STATUS_STYLES.draft;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${styles.bg} ${styles.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} />
      {label}
    </span>
  );
}
