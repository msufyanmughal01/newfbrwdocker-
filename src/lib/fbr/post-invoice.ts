// FBR Post Invoice API Caller
// Calls /di_data/v1/di/postinvoicedata (or _sb for sandbox)
// Returns FBR invoice number on success

import { fbrPost } from './api-client';
import type { FBRInvoicePayload } from '../invoices/fbr-mapping';
import type { FBRValidateResponse } from './validate';

// ─── FBR Post API Response ────────────────────────────────────────────────────

export interface FBRPostResponse {
  invoiceNumber: string; // e.g. "7000007DI1747119701593" (22 or 28 chars)
  dated: string; // ISO date string
  validationResponse: FBRValidateResponse;
}

// ─── FBR Raw Post API Shape ───────────────────────────────────────────────────

interface FBRRawPostResponse {
  statusCode: string;
  status: string;
  invoiceNumber?: string;
  dated?: string;
  validationResponse?: FBRValidateResponse;
}

// ─── Main Post Function ───────────────────────────────────────────────────────

export class FBRSubmissionError extends Error {
  constructor(
    message: string,
    public statusCode: string,
    public fbrStatus: string
  ) {
    super(message);
    this.name = 'FBRSubmissionError';
  }
}

/**
 * Post a validated invoice to FBR and receive the official FBR invoice number.
 * Throws FBRSubmissionError on FBR rejection.
 * Throws FBRApiError on network/timeout issues.
 */
export async function postToFBR(
  payload: FBRInvoicePayload,
  userId?: string
): Promise<FBRPostResponse> {
  const raw = (await fbrPost('postinvoicedata', payload, userId)) as FBRRawPostResponse;

  if (raw.statusCode !== '00' || !raw.invoiceNumber) {
    throw new FBRSubmissionError(
      raw.status ?? 'FBR submission failed',
      raw.statusCode ?? '',
      raw.status ?? ''
    );
  }

  return {
    invoiceNumber: raw.invoiceNumber,
    dated: raw.dated ?? new Date().toISOString(),
    validationResponse: raw.validationResponse ?? {
      statusCode: '00',
      status: 'Valid',
    },
  };
}
