'use client';

// FBRErrorDisplay — shows FBR validation errors grouped by header vs line items
// Errors use plain-English messages from the error code catalog (no raw codes shown to users)

import type { FBRErrorItem } from '@/lib/fbr/validate';

interface FBRErrorDisplayProps {
  errors: FBRErrorItem[];
  onFieldHighlight?: (fieldPath: string) => void;
}

export function FBRErrorDisplay({ errors, onFieldHighlight }: FBRErrorDisplayProps) {
  if (errors.length === 0) return null;

  // Separate header-level from item-level errors
  const headerErrors = errors.filter((e) => e.itemSNo === null);
  const itemErrors = errors.filter((e) => e.itemSNo !== null);

  // Group item errors by itemSNo
  const itemErrorsByNo = itemErrors.reduce<Record<string, FBRErrorItem[]>>((acc, err) => {
    const key = err.itemSNo!;
    acc[key] = acc[key] ?? [];
    acc[key].push(err);
    return acc;
  }, {});

  const sortedItemNos = Object.keys(itemErrorsByNo).sort(
    (a, b) => parseInt(a, 10) - parseInt(b, 10)
  );

  return (
    <div className="rounded-lg border border-[var(--error)]/20 bg-[var(--error-bg)] p-4" role="alert">
      <div className="flex items-start gap-3 mb-3">
        <svg className="h-5 w-5 text-[var(--error)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-sm font-semibold text-[var(--error)]">
          FBR Validation Failed — {errors.length} issue{errors.length !== 1 ? 's' : ''} found
        </h3>
      </div>

      {/* Header-level errors */}
      {headerErrors.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-[var(--error)] uppercase tracking-wide mb-2">
            Invoice Header
          </p>
          <ul className="space-y-1">
            {headerErrors.map((err, i) => (
              <ErrorItem
                key={`header-${i}`}
                err={err}
                onFieldHighlight={onFieldHighlight}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Item-level errors grouped by line item number */}
      {sortedItemNos.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[var(--error)] uppercase tracking-wide mb-2">
            Line Items
          </p>
          {sortedItemNos.map((itemNo) => (
            <div key={itemNo} className="mb-2">
              <p className="text-xs font-medium text-[var(--error)] mb-1">
                Item {itemNo}
              </p>
              <ul className="space-y-1 ml-2">
                {itemErrorsByNo[itemNo].map((err, i) => (
                  <ErrorItem
                    key={`item-${itemNo}-${i}`}
                    err={err}
                    onFieldHighlight={onFieldHighlight}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ErrorItem({
  err,
  onFieldHighlight,
}: {
  err: FBRErrorItem;
  onFieldHighlight?: (fieldPath: string) => void;
}) {
  const isWarning = err.severity === 'warning';

  return (
    <li className="flex items-start gap-2">
      <span
        className={`mt-0.5 shrink-0 text-xs ${isWarning ? 'text-[var(--warning)]' : 'text-[var(--error)]'}`}
      >
        {isWarning ? '⚠' : '✗'}
      </span>
      <span className="text-xs text-[var(--error)] flex-1">{err.friendlyMessage}</span>
      {onFieldHighlight && err.fieldPath && (
        <button
          type="button"
          onClick={() => onFieldHighlight(err.fieldPath)}
          className="text-xs text-[var(--error)] underline hover:opacity-80 shrink-0"
        >
          Go to field
        </button>
      )}
    </li>
  );
}
