'use client';

// SubmissionStatus — animated step-by-step FBR submission progress
// Shows: Validating → Validated → Submitting → Issued (or Failed)

import type { InvoiceStatus } from '@/lib/fbr/status-machine';

interface SubmissionStatusProps {
  status: InvoiceStatus;
  fbrInvoiceNumber?: string;
  error?: string;
  errorCode?: string | null;
}

interface Step {
  key: InvoiceStatus;
  label: string;
  activeLabel: string;
}

const STEPS: Step[] = [
  { key: 'validating', label: 'Validate', activeLabel: 'Validating with FBR...' },
  { key: 'validated', label: 'Validated', activeLabel: 'Validation passed' },
  { key: 'submitting', label: 'Submit', activeLabel: 'Submitting to FBR...' },
  { key: 'issued', label: 'Issued', activeLabel: 'Invoice Issued' },
];

const STATUS_ORDER: InvoiceStatus[] = [
  'draft',
  'validating',
  'validated',
  'submitting',
  'issued',
  'failed',
];

function getStepIndex(status: InvoiceStatus): number {
  return STATUS_ORDER.indexOf(status);
}

export function SubmissionStatus({
  status,
  fbrInvoiceNumber,
  error,
  errorCode,
}: SubmissionStatusProps) {
  const isFailed = status === 'failed';
  const currentIdx = getStepIndex(status);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
      <h3 className="mb-4 text-sm font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
        FBR Submission Progress
      </h3>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((step, i) => {
          const stepIdx = getStepIndex(step.key);
          const isCompleted = !isFailed && currentIdx > stepIdx;
          const isActive = !isFailed && currentIdx === stepIdx;
          const isFutureOrFailed =
            isFailed || currentIdx < stepIdx;

          return (
            <div key={step.key} className="flex items-center flex-1">
              {/* Circle */}
              <div
                className={`
                  flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all
                  ${isCompleted ? 'bg-[var(--positive)] text-white' : ''}
                  ${isActive && !isFailed ? 'bg-[var(--info)] text-white animate-pulse' : ''}
                  ${isFutureOrFailed && !isCompleted && !isActive ? 'bg-[var(--surface-3)] text-[var(--foreground-subtle)]' : ''}
                `}
              >
                {isCompleted ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : isActive ? (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>

              {/* Label */}
              <span
                className={`
                  ml-1 text-xs font-medium truncate
                  ${isCompleted ? 'text-[var(--positive)]' : ''}
                  ${isActive ? 'text-[var(--info)]' : ''}
                  ${isFutureOrFailed && !isCompleted && !isActive ? 'text-[var(--foreground-subtle)]' : ''}
                `}
              >
                {isActive ? step.activeLabel : step.label}
              </span>

              {/* Connector line (not after last) */}
              {i < STEPS.length - 1 && (
                <div
                  className={`
                    ml-2 h-0.5 flex-1 transition-all
                    ${isCompleted ? 'bg-[var(--positive)]' : 'bg-[var(--border)]'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Success state */}
      {status === 'issued' && fbrInvoiceNumber && (
        <div className="rounded-md bg-[var(--positive-bg)] border border-[var(--positive)]/20 p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-[var(--positive)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-[var(--positive)]">Invoice Issued by FBR</p>
              <p className="mt-1 text-xs text-[var(--positive)]">
                FBR Invoice Number:{' '}
                <span className="font-mono font-bold">{fbrInvoiceNumber}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Failed state */}
      {isFailed && (() => {
        const isTokenMissing = errorCode === 'FBR_TOKEN_MISSING';
        const isIpRestriction = !isTokenMissing && !!error && (
          /invalid.?format/i.test(error) ||
          /ip.*(not|un).*(register|allow|whitelist)/i.test(error) ||
          /not.*register.*ip/i.test(error) ||
          /access.*(denied|forbidden)/i.test(error)
        );
        if (isTokenMissing) {
          return (
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 p-4">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">FBR Token Not Configured</p>
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    Add your FBR bearer token in{' '}
                    <a href="/settings/business-profile" className="underline font-semibold hover:opacity-80">
                      Business Settings
                    </a>{' '}
                    to submit invoices.
                  </p>
                </div>
              </div>
            </div>
          );
        }
        if (isIpRestriction) {
          return (
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 p-4">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Server IP Not Registered with FBR</p>
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    FBR returned: <span className="font-mono">{error}</span>
                  </p>
                  <p className="mt-2 text-xs text-amber-700 dark:text-amber-300 font-medium">To fix this:</p>
                  <ol className="mt-1 text-xs text-amber-600 dark:text-amber-400 list-decimal list-inside space-y-1">
                    <li>Log in to the FBR IRIS portal (iris.fbr.gov.pk)</li>
                    <li>Go to Digital Invoicing → IP Whitelist / Server Registration</li>
                    <li>Add your server&apos;s public IP address</li>
                    <li>Wait a few minutes for FBR to activate it, then retry</li>
                  </ol>
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    Note: The invoice data and format are correct — only the IP registration is needed.
                  </p>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="rounded-md bg-[var(--error-bg)] border border-[var(--error)]/20 p-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-[var(--error)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-[var(--error)]">FBR Submission Failed</p>
                {error && <p className="mt-1 text-xs text-[var(--error)]">{error}</p>}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
