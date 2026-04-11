// T021 [US3]: Line item row component (memoized) for single line item
'use client';

import { memo } from 'react';
import { UseFormReturn, Path } from 'react-hook-form';
import { InvoiceFormData } from '@/lib/invoices/validation';
import { FBR_SALE_TYPES } from '@/lib/invoices/fbr-reference-data';
import type { TaxRateOption } from '@/lib/fbr/reference/tax-rates';
import { HSCodeSearch } from './HSCodeSearch';
import { FBRErrorBoundary } from './FBRErrorBoundary';

interface LineItemRowProps {
  form: UseFormReturn<InvoiceFormData>;
  index: number;
  onRemove: () => void;
  calculatedTotal?: number;
  uomOptions?: string[];
  taxRateOptions?: TaxRateOption[];
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "8px",
      marginBottom: "10px",
    }}>
      <span style={{
        fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
        textTransform: "uppercase", color: "var(--foreground-subtle)",
        whiteSpace: "nowrap",
      }}>{children}</span>
      <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
    </div>
  );
}

export const LineItemRow = memo(function LineItemRow({
  form,
  index,
  onRemove,
  calculatedTotal,
  uomOptions = [],
  taxRateOptions = [],
}: LineItemRowProps) {
  const {
    register,
    formState: { errors },
  } = form;

  const itemErrors = errors.items?.[index];

  const getFieldName = (field: string): Path<InvoiceFormData> => {
    return `items.${index}.${field}` as Path<InvoiceFormData>;
  };

  const inputBase = `w-full px-2 py-1.5 text-sm border rounded focus:ring-2 bg-[var(--surface)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 transition-colors`;
  const inputError = `border-[var(--error)] focus:ring-[var(--error)]/20 bg-[var(--error-bg)]`;
  const inputNormal = `border-[var(--border)] focus:ring-[var(--primary)]/20`;

  return (
    <div style={{
      border: "1px solid var(--border)",
      borderRadius: "12px",
      background: "var(--surface-2)",
      overflow: "hidden",
    }}>
      {/* Row header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface-3)",
      }}>
        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--foreground-muted)" }}>
          Item #{index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove line item"
          style={{
            display: "flex", alignItems: "center", gap: "4px",
            fontSize: "11px", fontWeight: 600, color: "var(--error)",
            background: "var(--error-bg)", border: "1px solid var(--error)",
            borderRadius: "6px", padding: "3px 10px", cursor: "pointer",
            transition: "opacity 0.15s",
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
          Remove
        </button>
      </div>

      <div style={{ padding: "16px" }}>

        {/* ── SECTION 1: Product Info ─────────────────────── */}
        <SectionLabel>Product Info</SectionLabel>
        <div className="grid grid-cols-12 gap-3" style={{ marginBottom: "20px" }}>
          {/* HS Code */}
          <div className="col-span-12 md:col-span-4">
            <label className="block text-xs font-medium mb-1">
              HS Code <span className="text-[var(--error)]">*</span>
            </label>
            <FBRErrorBoundary>
              <HSCodeSearch form={form} index={index} />
            </FBRErrorBoundary>
            {itemErrors?.hsCode && (
              <p className="text-[var(--error)] text-xs mt-1">{itemErrors.hsCode.message}</p>
            )}
          </div>

          {/* Product Description */}
          <div className="col-span-12 md:col-span-8">
            <label className="block text-xs font-medium mb-1">
              Description <span className="text-[var(--error)]">*</span>
            </label>
            <input
              type="text"
              {...register(getFieldName('productDescription'))}
              placeholder="Product name and details"
              className={`${inputBase} ${itemErrors?.productDescription ? inputError : inputNormal}`}
            />
            {itemErrors?.productDescription && (
              <p className="text-[var(--error)] text-xs mt-1">{itemErrors.productDescription.message}</p>
            )}
          </div>
        </div>

        {/* ── SECTION 2: Quantity & Pricing ──────────────── */}
        <SectionLabel>Quantity &amp; Pricing</SectionLabel>
        <div className="grid grid-cols-12 gap-3" style={{ marginBottom: "20px" }}>
          {/* Quantity */}
          <div className="col-span-6 md:col-span-2">
            <label className="block text-xs font-medium mb-1">
              Qty <span className="text-[var(--error)]">*</span>
            </label>
            <input
              type="number"
              step="0.0001"
              {...register(getFieldName('quantity'), { valueAsNumber: true })}
              className={`${inputBase} ${itemErrors?.quantity ? inputError : inputNormal}`}
            />
            {itemErrors?.quantity && (
              <p className="text-[var(--error)] text-xs mt-1">{itemErrors.quantity.message}</p>
            )}
          </div>

          {/* UOM */}
          <div className="col-span-6 md:col-span-3">
            <label className="block text-xs font-medium mb-1">
              UOM <span className="text-[var(--error)]">*</span>
            </label>
            <select
              {...register(getFieldName('uom'))}
              className={`${inputBase} ${itemErrors?.uom ? inputError : inputNormal}`}
            >
              <option value="">Select...</option>
              {uomOptions.map((uom) => (
                <option key={uom} value={uom}>{uom}</option>
              ))}
            </select>
            {itemErrors?.uom && (
              <p className="text-[var(--error)] text-xs mt-1">{itemErrors.uom.message}</p>
            )}
          </div>

          {/* Value (excluding ST) */}
          <div className="col-span-6 md:col-span-3">
            <label className="block text-xs font-medium mb-1">
              Value (excl. tax) <span className="text-[var(--error)]">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              {...register(getFieldName('valueSalesExcludingST'), { valueAsNumber: true })}
              className={`${inputBase} ${itemErrors?.valueSalesExcludingST ? inputError : inputNormal}`}
            />
            {itemErrors?.valueSalesExcludingST && (
              <p className="text-[var(--error)] text-xs mt-1">{itemErrors.valueSalesExcludingST.message}</p>
            )}
          </div>

          {/* Discount */}
          <div className="col-span-6 md:col-span-2">
            <label className="block text-xs font-medium mb-1">Discount</label>
            <input
              type="number"
              step="0.01"
              {...register(getFieldName('discount'), { valueAsNumber: true })}
              defaultValue={0}
              className={`${inputBase} ${inputNormal}`}
            />
          </div>

          {/* Calculated Total (read-only) */}
          <div className="col-span-12 md:col-span-2">
            <label className="block text-xs font-medium mb-1">Total</label>
            <input
              type="text"
              value={calculatedTotal ? `PKR ${calculatedTotal.toLocaleString()}` : '-'}
              readOnly
              className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--surface-3)] text-[var(--foreground-muted)]"
            />
          </div>
        </div>

        {/* ── SECTION 3: Tax Details ──────────────────────── */}
        <SectionLabel>Tax Details</SectionLabel>
        <div className="grid grid-cols-12 gap-3" style={{ marginBottom: "20px" }}>
          {/* Tax Rate */}
          <div className="col-span-6 md:col-span-3">
            <label className="block text-xs font-medium mb-1">
              Tax Rate <span className="text-[var(--error)]">*</span>
            </label>
            <select
              {...register(getFieldName('rate'))}
              className={`${inputBase} ${itemErrors?.rate ? inputError : inputNormal}`}
            >
              <option value="">Select...</option>
              {taxRateOptions.map((rate) => (
                <option key={rate.id} value={rate.label}>{rate.label}</option>
              ))}
            </select>
            {itemErrors?.rate && (
              <p className="text-[var(--error)] text-xs mt-1">{itemErrors.rate.message}</p>
            )}
          </div>

          {/* Sales Tax (Auto) */}
          <div className="col-span-6 md:col-span-3">
            <label className="block text-xs font-medium mb-1">Sales Tax (Auto)</label>
            <div className="w-full px-2 py-1.5 text-sm border border-[var(--primary)] rounded bg-[var(--primary-subtle)] font-mono text-[var(--primary)] flex items-center justify-end">
              {calculatedTotal !== undefined ? `PKR ${calculatedTotal.toFixed(2)}` : 'PKR 0.00'}
            </div>
          </div>

          {/* Sale Type */}
          <div className="col-span-12 md:col-span-6">
            <label className="block text-xs font-medium mb-1">
              Sale Type <span className="text-[var(--error)]">*</span>
            </label>
            <select
              {...register(getFieldName('saleType'))}
              className={`${inputBase} ${itemErrors?.saleType ? inputError : inputNormal}`}
            >
              <option value="">Select...</option>
              {FBR_SALE_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {itemErrors?.saleType && (
              <p className="text-[var(--error)] text-xs mt-1">{itemErrors.saleType.message}</p>
            )}
          </div>
        </div>

        {/* ── SECTION 4: Additional FBR Fields ───────────── */}
        <SectionLabel>Additional (FBR)</SectionLabel>
        <div className="grid grid-cols-12 gap-3">
          {/* SRO Schedule No */}
          <div className="col-span-12 md:col-span-4">
            <label className="block text-xs font-medium mb-1">
              SRO Schedule No
              <span className="ml-1 text-[var(--foreground-subtle)] font-normal">(if applicable)</span>
            </label>
            <input
              type="text"
              {...register(getFieldName('sroScheduleNo'))}
              placeholder="e.g. SRO 297(I)/2023"
              className={`${inputBase} ${inputNormal}`}
            />
          </div>

          {/* SRO Item Serial No */}
          <div className="col-span-12 md:col-span-4">
            <label className="block text-xs font-medium mb-1">
              SRO Item Serial No
              <span className="ml-1 text-[var(--foreground-subtle)] font-normal">(if applicable)</span>
            </label>
            <input
              type="text"
              {...register(getFieldName('sroItemSerialNo'))}
              placeholder="e.g. 1"
              className={`${inputBase} ${inputNormal}`}
            />
          </div>

          {/* FED Payable */}
          <div className="col-span-6 md:col-span-4">
            <label className="block text-xs font-medium mb-1">FED Payable</label>
            <input
              type="number"
              step="0.01"
              {...register(getFieldName('fedPayable'), { valueAsNumber: true })}
              defaultValue={0}
              className={`${inputBase} ${inputNormal}`}
            />
          </div>
        </div>

      </div>

      {/* Hidden fields */}
      <input type="hidden" {...register(getFieldName('fixedNotifiedValueOrRetailPrice'), { valueAsNumber: true })} value={0} />
      <input type="hidden" {...register(getFieldName('salesTaxWithheldAtSource'), { valueAsNumber: true })} value={0} />
      <input type="hidden" {...register(getFieldName('extraTax'), { valueAsNumber: true })} value={0} />
      <input type="hidden" {...register(getFieldName('furtherTax'), { valueAsNumber: true })} value={0} />
    </div>
  );
});
