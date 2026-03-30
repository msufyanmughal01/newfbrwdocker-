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
  errorCode?: string;
  error?: string;
}

export interface FBRValidateResponse {
  statusCode: string;
  status: string;
  invoiceStatuses?: FBRItemStatus[];
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
 * The scenarioId is injected into the payload only in sandbox mode.
 */
export async function validateWithFBR(
  payload: FBRInvoicePayload,
  userId?: string
): Promise<FBRValidationResult> {
  const raw = (await fbrPost('validateinvoicedata', payload, userId)) as FBRValidateResponse;

  const errors: FBRErrorItem[] = [];
  let valid = false;

  // Status code '00' = valid
  if (raw.statusCode === '00' || raw.status?.toLowerCase() === 'valid') {
    valid = true;
  }

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

  // Header-level error (statusCode != '00' but no invoiceStatuses)
  if (!valid && errors.length === 0 && raw.statusCode !== '00') {
    // Map status code to an error entry if possible
    const entry = getErrorEntry(raw.statusCode ?? '0113');
    errors.push({
      itemSNo: null,
      errorCode: raw.statusCode ?? '0113',
      rawMessage: raw.status ?? 'Unknown FBR error',
      friendlyMessage: entry.userMessage,
      fieldPath: entry.fieldPath,
      severity: entry.severity,
    });
  }

  return { valid, errors, fbrResponse: raw };
}
