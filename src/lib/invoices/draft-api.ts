// draft-api.ts — Server-side draft save/update helpers
// Wraps the invoices API for client-side use by the invoice form

import type { InvoiceFormData } from '@/lib/invoices/validation';

/**
 * Creates a new server-side draft invoice.
 * Returns the created invoice ID on success.
 */
export async function createServerDraft(
  data: Partial<InvoiceFormData>
): Promise<{ invoiceId: string }> {
  const response = await fetch('/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, status: 'draft' }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? 'Failed to save draft');
  }
  return response.json() as Promise<{ invoiceId: string }>;
}

/**
 * Updates an existing server-side draft invoice.
 */
export async function updateServerDraft(
  draftId: string,
  data: Partial<InvoiceFormData>
): Promise<void> {
  const response = await fetch(`/api/invoices/${draftId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, status: 'draft' }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? 'Failed to update draft');
  }
}
