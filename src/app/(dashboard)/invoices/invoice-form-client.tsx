// T024 [US1]: Main invoice form client component with React Hook Form and calculations
'use client';

import { useForm, DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoiceSchema, InvoiceFormData } from '@/lib/invoices/validation';
import { InvoiceHeader } from '@/components/invoices/InvoiceHeader';
import { LineItemsTable } from '@/components/invoices/LineItemsTable';
import { InvoiceSummary } from '@/components/invoices/InvoiceSummary';
import { DraftIndicator } from '@/components/invoices/DraftIndicator';
import { SubmissionStatus } from '@/components/invoices/SubmissionStatus';
import { FBRErrorDisplay } from '@/components/invoices/FBRErrorDisplay';
import { calculateInvoiceTotals } from '@/lib/invoices/calculations';
import { FBR_SCENARIOS } from '@/lib/fbr/scenarios';
import type { InvoiceStatus } from '@/lib/fbr/status-machine';
import type { FBRErrorItem } from '@/lib/fbr/validate';
import { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ClientValidationBadge } from '@/components/invoices/ClientValidationBadge';

interface SellerProfile {
  businessName?: string | null;
  ntnCnic?: string | null;
  province?: string | null;
  address?: string | null;
}

interface InvoiceFormClientProps {
  isSandbox?: boolean;
  sellerProfile?: SellerProfile | null;
  initialDraftId?: string | null;
  initialData?: Partial<InvoiceFormData>;
}

const DEFAULT_LINE_ITEM = {
  hsCode: '',
  productDescription: '',
  quantity: 1,
  uom: 'Numbers, pieces, units',
  valueSalesExcludingST: 0,
  fixedNotifiedValueOrRetailPrice: 0,
  discount: 0,
  rate: '18%',
  salesTaxApplicable: 0,
  salesTaxWithheldAtSource: 0,
  extraTax: 0,
  furtherTax: 0,
  saleType: 'Goods at standard rate (default)',
  sroScheduleNo: '',
  fedPayable: 0,
  sroItemSerialNo: '',
  totalValues: 0,
};

const DEFAULT_FORM_DATA: Partial<InvoiceFormData> = {
  invoiceType: 'Sale Invoice',
  invoiceDate: new Date().toISOString().split('T')[0],
  buyerRegistrationType: 'Registered',
  items: [DEFAULT_LINE_ITEM],
};

function buildDefaultValues(
  sellerProfile?: SellerProfile | null,
  initialData?: Partial<InvoiceFormData>
): Partial<InvoiceFormData> {
  return {
    ...DEFAULT_FORM_DATA,
    sellerBusinessName: sellerProfile?.businessName ?? undefined,
    sellerNTNCNIC: sellerProfile?.ntnCnic ?? undefined,
    sellerProvince: (sellerProfile?.province ?? undefined) as InvoiceFormData['sellerProvince'],
    sellerAddress: sellerProfile?.address ?? undefined,
    // Draft data overrides defaults (preserves user's saved progress)
    ...initialData,
  };
}

export function InvoiceFormClient({ isSandbox = false, sellerProfile, initialDraftId, initialData }: InvoiceFormClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitErrorCode, setSubmitErrorCode] = useState<string | null>(null);

  // FBR submission state (T021)
  const [fbrStatus, setFbrStatus] = useState<InvoiceStatus | null>(null);
  const [fbrInvoiceNumber, setFbrInvoiceNumber] = useState<string | null>(null);
  const [fbrErrors, setFbrErrors] = useState<FBRErrorItem[]>([]);

  // Sandbox scenario selector (T022)
  const [scenarioId, setScenarioId] = useState<string>('SN001');

  // Draft management state
  const [draftId, setDraftId] = useState<string | null>(initialDraftId ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);

  const form = useForm<InvoiceFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(invoiceSchema) as any,
    defaultValues: buildDefaultValues(sellerProfile, initialData) as DefaultValues<InvoiceFormData>,
    mode: 'onTouched', // Only validate after user touches a field
  });

  const { handleSubmit, watch, formState: { errors, isValid }, reset } = form;

  // T020: Server-side Save Draft handler (uses invoice_drafts table for partial saves)
  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true);
    setDraftError(null);
    try {
      const formData = watch();
      if (!draftId) {
        // Create new draft in invoice_drafts table (accepts partial data)
        const res = await fetch('/api/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const result = await res.json() as { draftId?: string };
          if (result.draftId) setDraftId(result.draftId);
          setLastSaved(Date.now());
        } else {
          setDraftError('Failed to save draft. Please try again.');
        }
      } else {
        // Update existing draft
        const res = await fetch(`/api/drafts/${draftId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          setLastSaved(Date.now());
        } else {
          setDraftError('Failed to update draft. Please try again.');
        }
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
      setDraftError('Failed to save draft. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [draftId, watch]);

  // Watch items for real-time calculation (T027)
  // Use useWatch for better reactivity
  const items = watch('items') || [];

  // Force re-render by stringifying items to detect deep changes
  const itemsKey = JSON.stringify(items);

  // Calculate totals with memoization (T027)
  const calculations = useMemo(() => {
    if (!items || items.length === 0) return null;

    try {
      return calculateInvoiceTotals(items);
    } catch (error) {
      console.error('Calculation error:', error);
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey]);

  // T021: Two-step FBR submission flow
  const onSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitErrorCode(null);
    setFbrErrors([]);
    setFbrStatus(null);
    setFbrInvoiceNumber(null);

    try {
      // Step 1: Save invoice to our DB (get invoiceId)
      const saveResponse = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const saveResult = await saveResponse.json();
      if (!saveResponse.ok) {
        throw new Error(saveResult.error || 'Failed to save invoice');
      }

      const invoiceId: string = saveResult.invoiceId;

      // Step 2: Submit to FBR (validate → post)
      setFbrStatus('validating');

      const submitResponse = await fetch('/api/fbr/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          scenarioId: isSandbox ? scenarioId : undefined,
        }),
      });

      const submitResult = await submitResponse.json();

      if (submitResponse.status === 201 && submitResult.success) {
        // Success!
        setFbrStatus('issued');
        setFbrInvoiceNumber(submitResult.fbrInvoiceNumber);

        // Delete draft on success
        // Redirect to invoice detail page after short delay
        setTimeout(() => {
          router.push(`/invoices/${invoiceId}`);
          router.refresh();
        }, 2000);

      } else if (submitResult.stage === 'validation' && submitResult.errors) {
        setFbrStatus('failed');
        setFbrErrors(submitResult.errors);
      } else {
        setFbrStatus('failed');
        setSubmitErrorCode((submitResult as { code?: string }).code ?? null);
        setSubmitError(
          (submitResult as { message?: string; fbrError?: { error?: string }; error?: string }).message ??
          (submitResult as { fbrError?: { error?: string } }).fbrError?.error ??
          (submitResult as { error?: string }).error ??
          'FBR submission failed'
        );
      }

    } catch (error) {
      console.error('Submit error:', error);
      setFbrStatus('failed');
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  // T048: Wire FBRErrorDisplay field highlighting to form
  const handleFieldHighlight = useCallback(
    (fieldPath: string) => {
      // Convert dot-notation path to React Hook Form field path
      // e.g. 'items.0.hsCode' → form.setFocus('items.0.hsCode')
      try {
        form.setFocus(fieldPath as Parameters<typeof form.setFocus>[0]);
      } catch {
        // Field may not be focusable; scroll to form top as fallback
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [form]
  );

  // T032: Collect all validation errors for summary
  const errorCount = Object.keys(errors).length;
  const hasItemErrors = errors.items && Array.isArray(errors.items) && errors.items.some(item => item !== undefined);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* FBR Submission Progress (T021) */}
      {fbrStatus && (
        <SubmissionStatus
          status={fbrStatus}
          fbrInvoiceNumber={fbrInvoiceNumber ?? undefined}
          error={submitError ?? undefined}
        />
      )}

      {/* FBR Validation Errors (T020) */}
      {fbrErrors.length > 0 && (
        <FBRErrorDisplay errors={fbrErrors} onFieldHighlight={handleFieldHighlight} />
      )}

      {/* FBR Token Missing Error */}
      {submitError && submitErrorCode === 'FBR_TOKEN_MISSING' && fbrErrors.length === 0 && (
        <div className="bg-[var(--warning-bg)] border border-[var(--warning)]/20 rounded-lg p-4">
          <p className="text-sm font-semibold text-[var(--warning)]">No FBR token configured</p>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            {submitError}{' '}
            <a href="/settings/business-profile" className="underline font-medium text-[var(--warning)]">
              Go to Settings → Business Profile
            </a>
          </p>
        </div>
      )}

      {/* Generic Error Alert */}
      {submitError && submitErrorCode !== 'FBR_TOKEN_MISSING' && fbrErrors.length === 0 && (
        <div className="bg-[var(--error-bg)] border border-[var(--error)]/20 rounded-lg p-4">
          <p className="text-sm font-semibold text-[var(--error)]">Error submitting invoice</p>
          <p className="text-xs text-[var(--error)] mt-1">{submitError}</p>
        </div>
      )}

      {/* T032: Validation Error Summary */}
      {errorCount > 0 && (
        <div className="rounded-lg border border-[var(--warning)]/20 bg-[var(--warning-bg)] p-4">
          <div className="flex items-start">
            <span className="text-[var(--warning)] mr-3 text-xl">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--warning)]">Please fix the following errors before submitting:</p>
              <ul className="mt-2 space-y-1 text-xs text-[var(--foreground-muted)]">
                {errors.invoiceType && <li>• Invoice Type: {errors.invoiceType.message}</li>}
                {errors.invoiceDate && <li>• Invoice Date: {errors.invoiceDate.message}</li>}
                {errors.invoiceRefNo && <li>• Invoice Reference: {errors.invoiceRefNo.message}</li>}
                {errors.sellerNTNCNIC && <li>• Seller NTN/CNIC: {errors.sellerNTNCNIC.message}</li>}
                {errors.sellerBusinessName && <li>• Seller Business Name: {errors.sellerBusinessName.message}</li>}
                {errors.sellerProvince && <li>• Seller Province: {errors.sellerProvince.message}</li>}
                {errors.sellerAddress && <li>• Seller Address: {errors.sellerAddress.message}</li>}
                {errors.buyerNTNCNIC && <li>• Buyer NTN/CNIC: {errors.buyerNTNCNIC.message}</li>}
                {errors.buyerBusinessName && <li>• Buyer Business Name: {errors.buyerBusinessName.message}</li>}
                {errors.buyerProvince && <li>• Buyer Province: {errors.buyerProvince.message}</li>}
                {errors.buyerAddress && <li>• Buyer Address: {errors.buyerAddress.message}</li>}
                {errors.buyerRegistrationType && <li>• Buyer Registration Type: {errors.buyerRegistrationType.message}</li>}
                {hasItemErrors && <li>• Line Items: One or more line items have validation errors (see below)</li>}
                {errors.items && !Array.isArray(errors.items) && errors.items.message && (
                  <li>• Line Items: {errors.items.message as string}</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Header */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-6">Invoice Information</h2>
        <InvoiceHeader form={form} />
        <ClientValidationBadge ntnCnic={watch('buyerNTNCNIC')} />
      </div>

      {/* Line Items */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6">
        <LineItemsTable form={form} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Form Actions */}
          <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6">
            {/* T041: Draft Indicator */}
            <div className="mb-4">
              <DraftIndicator
                isSaving={isSaving}
                lastSaved={lastSaved}
                draftId={draftId}
              />
              {draftError && (
                <p className="mt-1 text-xs text-[var(--error)]">{draftError}</p>
              )}
            </div>

            {/* T022: Sandbox Scenario Selector */}
            {isSandbox && (
              <div className="mb-4 p-3 bg-[var(--warning-bg)] border border-[var(--warning)]/20 rounded-lg">
                <label className="block text-xs font-semibold text-[var(--warning)] mb-1 uppercase tracking-wide">
                  🧪 Sandbox Scenario
                </label>
                <select
                  value={scenarioId}
                  onChange={(e) => setScenarioId(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                >
                  {FBR_SCENARIOS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} — {s.description}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                  Selected: <strong>{scenarioId}</strong> — {FBR_SCENARIOS.find(s => s.id === scenarioId)?.taxVariant}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              <button
                type="submit"
                disabled={isSubmitting || !isValid || fbrStatus === 'issued'}
                className="flex-1 px-6 py-3 bg-[var(--primary)] text-white rounded-lg font-semibold hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-px"
                title={!isValid ? 'Please fix validation errors before submitting' : ''}
              >
                {isSubmitting
                  ? fbrStatus === 'validating' ? 'Validating with FBR...'
                  : fbrStatus === 'submitting' ? 'Submitting to FBR...'
                  : 'Processing...'
                  : fbrStatus === 'issued' ? '✓ Invoice Issued'
                  : !isValid ? 'Fix Errors to Submit'
                  : 'Validate & Submit to FBR →'}
              </button>

              {/* T040: Manual Save Draft Button */}
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving || isSubmitting}
                className="px-6 py-3 border border-[var(--border)] bg-transparent hover:bg-[var(--surface-2)] text-[var(--foreground-muted)] rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                💾 Save Draft
              </button>

              <button
                type="button"
                onClick={() => reset()}
                disabled={isSubmitting}
                className="px-6 py-3 border border-[var(--border)] bg-transparent hover:bg-[var(--surface-2)] text-[var(--foreground-muted)] rounded-lg font-semibold disabled:opacity-50 transition-colors"
              >
                Clear Form
              </button>
            </div>

            {/* FBR Compliance Info */}
            <div className="mt-4 p-4 bg-[var(--info-bg)] border border-[var(--info)]/20 rounded-lg">
              <p className="text-sm text-[var(--info)]">
                <strong>✓ FBR Compliant:</strong> This form follows FBR Digital Invoicing API v1.12 specifications
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <InvoiceSummary calculations={calculations} isCalculating={false} />
        </div>
      </div>
    </form>
  );
}
