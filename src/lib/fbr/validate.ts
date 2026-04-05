// FBR Validate API Caller
// Calls /di_data/v1/di/validateinvoicedata (or _sb for sandbox)
// Returns typed FBRValidationResult with friendly error messages

import { fbrPost } from './api-client';
import { getErrorEntry } from './error-codes';
import type { FBRInvoicePayload } from '../invoices/fbr-mapping';

// ─── FBR API Response Types ───────────────────────────────────────────────────

export interface FBRItemStatus {
  itemSNo: string;
  statusCode: string;
  status: string;
  invoiceNo?: string | null;
  errorCode?: string | null;
  error?: string | null;
}

export interface FBRValidateResponse {
  statusCode: string;
  status: string;
  error?: string | null;
  errorCode?: string | null;
  invoiceStatuses?: FBRItemStatus[] | null;
}

// Actual wire shape from the FBR API — the validation result is wrapped.
interface FBRRawValidateApiResponse {
  dated?: string;
  validationResponse: FBRValidateResponse;
}

// ─── Our Typed Result ─────────────────────────────────────────────────────────

export interface FBRErrorItem {
  itemSNo: string | null; // null = header-level error
  errorCode: string;
  rawMessage: string;
  friendlyMessage: string;
  fieldPath: string; // Resolved field path (e.g. 'items.0.hsCode')
  severity: 'error' | 'warning';
}

export interface FBRValidationResult {
  valid: boolean;
  errors: FBRErrorItem[];
  fbrResponse: FBRValidateResponse;
}

// ─── Field Path Resolution ────────────────────────────────────────────────────

/**
 * Replace 'items[n]' placeholder with actual zero-based index.
 * FBR itemSNo is 1-based ("1", "2", ...) → convert to 0-based for form field paths.
 */
function resolveFieldPath(fieldPath: string, itemSNo: string | null): string {
  if (!fieldPath.includes('[n]') || itemSNo === null) return fieldPath;
  const idx = Math.max(0, parseInt(itemSNo, 10) - 1);
  return fieldPath.replace('[n]', `.${idx}`);
}

// ─── Main Validate Function ───────────────────────────────────────────────────

/**
 * Validate an invoice against the FBR Validate API.
 *
 * FBR response structure:
 *   { dated, validationResponse: { statusCode, status, invoiceStatuses } }
 *
 * Success:   validationResponse.statusCode === "00" AND status === "Valid"
 * Item fail: validationResponse.statusCode === "00" BUT status === "invalid" (item-level errors)
 * Header err: validationResponse.statusCode === "01", invoiceStatuses null
 */
export async function validateWithFBR(
  payload: FBRInvoicePayload,
  userId?: string
): Promise<FBRValidationResult> {
  // Unwrap the outer envelope — status fields live inside validationResponse
  const wrapped = (await fbrPost('validateinvoicedata', payload, userId)) as FBRRawValidateApiResponse;
  const raw = wrapped.validationResponse;

  const errors: FBRErrorItem[] = [];

  // Both conditions must be true for a clean validation pass.
  // FBR can return statusCode "00" with status "invalid" when items fail.
  const valid =
    raw.statusCode === '00' &&
    raw.status?.toLowerCase() === 'valid';

  // Parse per-item errors from invoiceStatuses array
  if (raw.invoiceStatuses) {
    for (const item of raw.invoiceStatuses) {
      if (item.statusCode !== '00' && item.errorCode) {
        const entry = getErrorEntry(item.errorCode);
        errors.push({
          itemSNo: item.itemSNo ?? null,
          errorCode: item.errorCode,
          rawMessage: item.error ?? '',
          friendlyMessage: entry.userMessage,
          fieldPath: resolveFieldPath(entry.fieldPath, item.itemSNo ?? null),
          severity: entry.severity,
        });
      }
    }
  }

  // Header-level error (non-"00" statusCode, no item statuses)
  if (!valid && errors.length === 0) {
    const headerErrorCode = raw.errorCode ?? raw.statusCode ?? '0113';
    const entry = getErrorEntry(headerErrorCode);
    errors.push({
      itemSNo: null,
      errorCode: headerErrorCode,
      rawMessage: raw.error ?? raw.status ?? 'Unknown FBR error',
      friendlyMessage: entry.userMessage,
      fieldPath: entry.fieldPath,
      severity: entry.severity,
    });
  }

  return { valid, errors, fbrResponse: raw };
}
