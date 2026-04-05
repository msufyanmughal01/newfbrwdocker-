// FBR Post Invoice API Caller
// Calls /di_data/v1/di/postinvoicedata (or _sb for sandbox)
// Returns FBR invoice number on success

import { fbrPost } from './api-client';
import type { FBRInvoicePayload } from '../invoices/fbr-mapping';
import type { FBRValidateResponse } from './validate';

// ─── FBR Post API Response (actual wire shape) ────────────────────────────────
// The FBR API wraps the validation result inside a "validationResponse" key.
// invoiceNumber is only present on success.

interface FBRRawPostResponse {
  invoiceNumber?: string;  // present on success, absent on failure
  dated?: string;
  validationResponse?: FBRValidateResponse;
}

// ─── Our Typed Result ─────────────────────────────────────────────────────────

export interface FBRPostResponse {
  invoiceNumber: string; // e.g. "7000007DI1747119701593" (22 or 28 chars)
  dated: string;
  validationResponse: FBRValidateResponse;
}

// ─── Error ────────────────────────────────────────────────────────────────────

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

// ─── Main Post Function ───────────────────────────────────────────────────────

/**
 * Post a validated invoice to FBR and receive the official FBR invoice number.
 *
 * Success: FBR returns { invoiceNumber, dated, validationResponse: { statusCode: "00" } }
 * Failure: FBR returns { dated, validationResponse: { statusCode: "01", error: "..." } }
 *
 * Throws FBRSubmissionError on FBR rejection.
 * Throws FBRApiError on network/timeout issues.
 */
export async function postToFBR(
  payload: FBRInvoicePayload,
  userId?: string
): Promise<FBRPostResponse> {
  const raw = (await fbrPost('postinvoicedata', payload, userId)) as FBRRawPostResponse;

  // A successful post always contains an invoiceNumber.
  // Status details live inside validationResponse, not at the root.
  if (!raw.invoiceNumber) {
    const vr = raw.validationResponse;
    throw new FBRSubmissionError(
      vr?.status ?? 'FBR submission failed',
      vr?.statusCode ?? '',
      vr?.status ?? ''
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
