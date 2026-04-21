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
import { encryptedPost } from '@/lib/crypto/transit-client';

interface SellerProfile {
  businessName?: string | null;
  ntnCnic?: string | null;
  cnic?: string | null;
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
    sellerNTNCNIC: sellerProfile?.ntnCnic ?? sellerProfile?.cnic ?? undefined,
    sellerProvince: (sellerProfile?.province ?? undefined) as InvoiceFormData['sellerProvince'],
    sellerAddress: sellerProfile?.address ?? undefined,
    ...initialData,
  };
}

export function InvoiceFormClient({ isSandbox = false, sellerProfile, initialDraftId, initialData }: InvoiceFormClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitErrorCode, setSubmitErrorCode] = useState<string | null>(null);

  const [fbrStatus, setFbrStatus] = useState<InvoiceStatus | null>(null);
  const [fbrInvoiceNumber, setFbrInvoiceNumber] = useState<string | null>(null);
  const [fbrErrors, setFbrErrors] = useState<FBRErrorItem[]>([]);

  const [scenarioId, setScenarioId] = useState<string>('SN001');

  const [draftId, setDraftId] = useState<string | null>(initialDraftId ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);

  const form = useForm<InvoiceFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(invoiceSchema) as any,
    defaultValues: buildDefaultValues(sellerProfile, initialData) as DefaultValues<InvoiceFormData>,
    mode: 'onTouched',
  });

  const { handleSubmit, watch, formState: { errors, isValid }, reset } = form;

  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true);
    setDraftError(null);
    try {
      const formData = watch();
      if (!draftId) {
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

  const items = watch('items') || [];
  const itemsKey = JSON.stringify(items);

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

  const onSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitErrorCode(null);
    setFbrErrors([]);
    setFbrStatus(null);
    setFbrInvoiceNumber(null);

    try {
      const saveResponse = await encryptedPost('/api/invoices', data);

      const saveResult = await saveResponse.json();
      if (!saveResponse.ok) {
        throw new Error(saveResult.error || 'Failed to save invoice');
      }

      const invoiceId: string = saveResult.invoiceId;

      setFbrStatus('validating');

      const submitResponse = await encryptedPost('/api/fbr/submit', {
        invoiceId,
        scenarioId: isSandbox ? scenarioId : undefined,
      });

      const submitResult = await submitResponse.json();

      if (submitResponse.status === 201 && submitResult.success) {
        setFbrStatus('issued');
        setFbrInvoiceNumber(submitResult.fbrInvoiceNumber);
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

  const handleFieldHighlight = useCallback(
    (fieldPath: string) => {
      try {
        form.setFocus(fieldPath as Parameters<typeof form.setFocus>[0]);
      } catch {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [form]
  );

  const errorCount = Object.keys(errors).length;
  const hasItemErrors = errors.items && Array.isArray(errors.items) && errors.items.some(item => item !== undefined);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* FBR Submission Progress */}
      {fbrStatus && (
        <SubmissionStatus
          status={fbrStatus}
          fbrInvoiceNumber={fbrInvoiceNumber ?? undefined}
          error={submitError ?? undefined}
          errorCode={submitErrorCode}
        />
      )}

      {/* FBR Validation Errors */}
      {fbrErrors.length > 0 && (
        <FBRErrorDisplay errors={fbrErrors} onFieldHighlight={handleFieldHighlight} />
      )}

      {/* FBR Token Missing */}
      {submitError && submitErrorCode === 'FBR_TOKEN_MISSING' && fbrErrors.length === 0 && (
        <div className="rounded-xl bg-[var(--warning-bg)] border border-[var(--warning)]/20 p-4 flex gap-3 items-start">
          <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-[var(--warning)] text-white text-xs font-bold flex items-center justify-center">!</div>
          <div>
            <p className="text-sm font-semibold text-[var(--warning)]">FBR token not configured</p>
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
              {submitError}{' '}
              <a href="/settings/business-profile" className="underline font-medium text-[var(--warning)]">
                Go to Settings
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Generic Submit Error */}
      {submitError && submitErrorCode !== 'FBR_TOKEN_MISSING' && fbrErrors.length === 0 && fbrStatus === 'failed' && (
        <div className="rounded-xl bg-[var(--error-bg)] border border-[var(--error)]/20 p-4 flex gap-3 items-start">
          <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-[var(--error)] text-white text-xs font-bold flex items-center justify-center">✕</div>
          <div>
            <p className="text-sm font-semibold text-[var(--error)]">Submission failed</p>
            <p className="text-xs text-[var(--error)]/80 mt-0.5">{submitError}</p>
          </div>
        </div>
      )}

      {/* Validation Error Summary */}
      {errorCount > 0 && (
        <div className="rounded-xl border border-[var(--warning)]/20 bg-[var(--warning-bg)] p-4 flex gap-3 items-start">
          <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-[var(--warning)] text-white text-xs font-bold flex items-center justify-center">!</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--warning)]">Fix errors before submitting</p>
            <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-[var(--foreground-muted)]">
              {errors.invoiceType && <li>• Invoice Type</li>}
              {errors.invoiceDate && <li>• Invoice Date</li>}
              {errors.invoiceRefNo && <li>• Invoice Reference</li>}
              {errors.sellerNTNCNIC && <li>• Seller NTN/CNIC</li>}
              {errors.sellerBusinessName && <li>• Seller Business Name</li>}
              {errors.sellerProvince && <li>• Seller Province</li>}
              {errors.sellerAddress && <li>• Seller Address</li>}
              {errors.buyerNTNCNIC && <li>• Buyer NTN/CNIC</li>}
              {errors.buyerBusinessName && <li>• Buyer Business Name</li>}
              {errors.buyerProvince && <li>• Buyer Province</li>}
              {errors.buyerAddress && <li>• Buyer Address</li>}
              {errors.buyerRegistrationType && <li>• Registration Type</li>}
              {hasItemErrors && <li>• Line item errors</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Main layout: form left, sticky sidebar right */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Left column: form sections */}
        <div className="space-y-5 min-w-0">
          {/* Section 1: Invoice Details */}
          <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-2)]">
              <span className="w-6 h-6 rounded-full bg-[var(--primary)] text-[var(--primary-fg)] text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
              <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wide">Invoice Details</h2>
            </div>
            <div className="p-6">
              <InvoiceHeader form={form} />
              <div className="mt-4">
                <ClientValidationBadge ntnCnic={watch('buyerNTNCNIC')} />
              </div>
            </div>
          </div>

          {/* Section 2: Line Items */}
          <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-2)]">
              <span className="w-6 h-6 rounded-full bg-[var(--primary)] text-[var(--primary-fg)] text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
              <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wide">Line Items</h2>
            </div>
            <div className="p-6">
              <LineItemsTable form={form} />
            </div>
          </div>
        </div>

        {/* Right column: sticky summary + actions */}
        <div className="xl:sticky xl:top-6 space-y-4">
          {/* Invoice Summary */}
          <InvoiceSummary calculations={calculations} isCalculating={false} />

          {/* Sandbox Scenario Selector */}
          {isSandbox && (
            <div className="rounded-xl bg-[var(--warning-bg)] border border-[var(--warning)]/30 p-4">
              <label className="block text-xs font-semibold text-[var(--warning)] uppercase tracking-wide mb-2">
                Sandbox Scenario
              </label>
              <select
                value={scenarioId}
                onChange={(e) => setScenarioId(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors"
              >
                {FBR_SCENARIOS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} — {s.description}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-[var(--warning)]/80">
                {FBR_SCENARIOS.find(s => s.id === scenarioId)?.taxVariant}
              </p>
            </div>
          )}

          {/* Actions Card */}
          <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-4 space-y-3">
            {(() => {
              const isTokenMissing = fbrStatus === 'failed' && submitErrorCode === 'FBR_TOKEN_MISSING';
              return (
                <button
                  type={isTokenMissing ? 'button' : 'submit'}
                  onClick={isTokenMissing ? () => router.push('/settings/business-profile') : undefined}
                  disabled={isSubmitting || fbrStatus === 'issued'}
                  className={`w-full py-3 px-6 rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-px active:translate-y-0 text-white ${
                    isTokenMissing
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)]'
                  }`}
                  title={!isValid && !isTokenMissing ? 'Fix validation errors before submitting' : ''}
                >
                  {isSubmitting
                    ? fbrStatus === 'validating' ? 'Validating with FBR...'
                    : fbrStatus === 'submitting' ? 'Submitting to FBR...'
                    : 'Processing...'
                    : fbrStatus === 'issued' ? '✓ Invoice Issued'
                    : isTokenMissing ? '⚙ Go to Settings — Add FBR Token'
                    : !isValid ? 'Fix Errors to Submit'
                    : 'Submit to FBR'}
                </button>
              );
            })()}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving || isSubmitting}
                className="py-2.5 px-4 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                type="button"
                onClick={() => reset()}
                disabled={isSubmitting}
                className="py-2.5 px-4 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] disabled:opacity-50 transition-colors"
              >
                Clear Form
              </button>
            </div>

            {/* Draft status */}
            <div className="pt-2 border-t border-[var(--border)]">
              <DraftIndicator isSaving={isSaving} lastSaved={lastSaved} draftId={draftId} />
              {draftError && <p className="mt-1 text-xs text-[var(--error)]">{draftError}</p>}
            </div>

            {/* FBR compliance note */}
            <div className="rounded-lg bg-[var(--info-bg)] border border-[var(--info)]/20 px-3 py-2">
              <p className="text-xs text-[var(--info)] text-center font-medium">
                FBR Digital Invoicing API v1.12
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
