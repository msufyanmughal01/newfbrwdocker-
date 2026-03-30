// Invoice Status State Machine
// Enforces valid status transitions — Constitution Principle IX (Data Integrity)
// Issued invoices are IMMUTABLE: no transitions away from 'issued' are allowed.

export type InvoiceStatus =
  | 'draft'
  | 'validating'
  | 'validated'
  | 'submitting'
  | 'issued'
  | 'failed';

/**
 * Allowed next states from each status.
 * `issued` → empty array: immutable, no further transitions.
 */
export const ALLOWED_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ['validating'],
  validating: ['validated', 'failed'],
  validated: ['submitting', 'draft'], // can re-validate (back to draft) or proceed
  submitting: ['issued', 'failed'],
  issued: [], // IMMUTABLE — once issued, no changes allowed
  failed: ['draft'], // can retry by going back to draft
};

export class InvalidStatusTransitionError extends Error {
  constructor(from: InvoiceStatus, to: InvoiceStatus) {
    super(
      `Invalid invoice status transition: ${from} → ${to}. ` +
        `Allowed transitions from ${from}: [${ALLOWED_TRANSITIONS[from].join(', ') || 'none'}]`
    );
    this.name = 'InvalidStatusTransitionError';
  }
}

/**
 * Validate and return the new status.
 * Throws `InvalidStatusTransitionError` if the transition is not allowed.
 */
export function transitionStatus(
  current: InvoiceStatus,
  next: InvoiceStatus
): InvoiceStatus {
  const allowed = ALLOWED_TRANSITIONS[current];
  if (!allowed.includes(next)) {
    throw new InvalidStatusTransitionError(current, next);
  }
  return next;
}

/**
 * Check whether a transition is valid without throwing.
 */
export function canTransition(
  current: InvoiceStatus,
  next: InvoiceStatus
): boolean {
  return ALLOWED_TRANSITIONS[current].includes(next);
}

/**
 * Check if an invoice status is terminal (no further transitions possible).
 */
export function isTerminalStatus(status: InvoiceStatus): boolean {
  return ALLOWED_TRANSITIONS[status].length === 0;
}

/**
 * Check if an invoice is immutable (issued status).
 */
export function isImmutable(status: InvoiceStatus): boolean {
  return status === 'issued';
}
