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

  // Helper to get field name with proper typing
  const getFieldName = (field: string): Path<InvoiceFormData> => {
    return `items.${index}.${field}` as Path<InvoiceFormData>;
  };

  return (
    <div className="grid grid-cols-12 gap-3 p-4 border border-[var(--border)] rounded-lg bg-[var(--surface-2)]">
      {/* HS Code — searchable dropdown (T034) */}
      <div className="col-span-12 md:col-span-3">
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
      <div className="col-span-12 md:col-span-4">
        <label className="block text-xs font-medium mb-1">
          Description <span className="text-[var(--error)]">*</span>
        </label>
        <input
          type="text"
          {...register(getFieldName('productDescription'))}
          placeholder="Product name and details"
          className={`w-full px-2 py-1.5 text-sm border rounded focus:ring-2 bg-[var(--surface-2)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 transition-colors ${
            itemErrors?.productDescription
              ? 'border-[var(--error)] focus:ring-[var(--error)] bg-[var(--error-bg)]'
              : 'border-[var(--border)] focus:ring-[var(--primary)]'
          }`}
        />
        {itemErrors?.productDescription && (
          <p className="text-[var(--error)] text-xs mt-1">{itemErrors.productDescription.message}</p>
        )}
      </div>

      {/* Quantity */}
      <div className="col-span-6 md:col-span-2">
        <label className="block text-xs font-medium mb-1">
          Qty <span className="text-[var(--error)]">*</span>
        </label>
        <input
          type="number"
          step="0.0001"
          {...register(getFieldName('quantity'), { valueAsNumber: true })}
          className={`w-full px-2 py-1.5 text-sm border rounded focus:ring-2 bg-[var(--surface-2)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 transition-colors ${
            itemErrors?.quantity
              ? 'border-[var(--error)] focus:ring-[var(--error)] bg-[var(--error-bg)]'
              : 'border-[var(--border)] focus:ring-[var(--primary)]'
          }`}
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
          className={`w-full px-2 py-1.5 text-sm border rounded focus:ring-2 bg-[var(--surface-2)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 transition-colors ${
            itemErrors?.uom
              ? 'border-[var(--error)] focus:ring-[var(--error)] bg-[var(--error-bg)]'
              : 'border-[var(--border)] focus:ring-[var(--primary)]'
          }`}
        >
          <option value="">Select...</option>
          {uomOptions.map((uom) => (
            <option key={uom} value={uom}>
              {uom}
            </option>
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
          className={`w-full px-2 py-1.5 text-sm border rounded focus:ring-2 bg-[var(--surface-2)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 transition-colors ${
            itemErrors?.valueSalesExcludingST
              ? 'border-[var(--error)] focus:ring-[var(--error)] bg-[var(--error-bg)]'
              : 'border-[var(--border)] focus:ring-[var(--primary)]'
          }`}
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
          className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded focus:ring-2 focus:ring-[var(--primary)]/20 bg-[var(--surface-2)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors"
        />
      </div>

      {/* Tax Rate */}
      <div className="col-span-6 md:col-span-2">
        <label className="block text-xs font-medium mb-1">
          Tax Rate <span className="text-[var(--error)]">*</span>
        </label>
        <select
          {...register(getFieldName('rate'))}
          className={`w-full px-2 py-1.5 text-sm border rounded focus:ring-2 bg-[var(--surface-2)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 transition-colors ${
            itemErrors?.rate
              ? 'border-[var(--error)] focus:ring-[var(--error)] bg-[var(--error-bg)]'
              : 'border-[var(--border)] focus:ring-[var(--primary)]'
          }`}
        >
          <option value="">Select...</option>
          {taxRateOptions.map((rate) => (
            <option key={rate.id} value={rate.label}>
              {rate.label}
            </option>
          ))}
        </select>
        {itemErrors?.rate && (
          <p className="text-[var(--error)] text-xs mt-1">{itemErrors.rate.message}</p>
        )}
      </div>

      {/* Sales Tax Applicable (Calculated) */}
      <div className="col-span-6 md:col-span-2">
        <label className="block text-xs font-medium mb-1">
          Sales Tax (Auto)
        </label>
        <div className="w-full px-2 py-1.5 text-sm border border-[var(--primary)] rounded bg-[var(--surface-2)] font-mono text-[var(--primary)] flex items-center justify-end">
          {calculatedTotal !== undefined
            ? `PKR ${calculatedTotal.toFixed(2)}`
            : 'PKR 0.00'
          }
        </div>
      </div>

      {/* Sale Type */}
      <div className="col-span-12 md:col-span-4">
        <label className="block text-xs font-medium mb-1">
          Sale Type <span className="text-[var(--error)]">*</span>
        </label>
        <select
          {...register(getFieldName('saleType'))}
          className={`w-full px-2 py-1.5 text-sm border rounded focus:ring-2 bg-[var(--surface-2)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 transition-colors ${
            itemErrors?.saleType
              ? 'border-[var(--error)] focus:ring-[var(--error)] bg-[var(--error-bg)]'
              : 'border-[var(--border)] focus:ring-[var(--primary)]'
          }`}
        >
          <option value="">Select...</option>
          {FBR_SALE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {itemErrors?.saleType && (
          <p className="text-[var(--error)] text-xs mt-1">{itemErrors.saleType.message}</p>
        )}
      </div>

      {/* Calculated Total (read-only) */}
      <div className="col-span-6 md:col-span-2">
        <label className="block text-xs font-medium mb-1">Total</label>
        <input
          type="text"
          value={calculatedTotal ? `PKR ${calculatedTotal.toLocaleString()}` : '-'}
          readOnly
          className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--surface-3)] text-[var(--foreground-muted)]"
        />
      </div>

      {/* Remove Button */}
      <div className="col-span-6 md:col-span-1 flex items-end">
        <button
          type="button"
          onClick={onRemove}
          className="w-full px-2 py-1.5 text-sm bg-[var(--error)] text-white rounded hover:opacity-90 transition"
          aria-label="Remove line item"
        >
          ✕
        </button>
      </div>

      {/* SRO Schedule No */}
      <div className="col-span-6 md:col-span-3">
        <label className="block text-xs font-medium mb-1">
          SRO Schedule No
          <span className="ml-1 text-[var(--foreground-subtle)] font-normal">(if applicable)</span>
        </label>
        <input
          type="text"
          {...register(getFieldName('sroScheduleNo'))}
          placeholder="e.g. SRO 297(I)/2023"
          className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded focus:ring-2 focus:ring-[var(--primary)]/20 bg-[var(--surface-2)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--primary)] transition-colors"
        />
      </div>

      {/* SRO Item Serial No */}
      <div className="col-span-6 md:col-span-3">
        <label className="block text-xs font-medium mb-1">
          SRO Item Serial No
          <span className="ml-1 text-[var(--foreground-subtle)] font-normal">(if applicable)</span>
        </label>
        <input
          type="text"
          {...register(getFieldName('sroItemSerialNo'))}
          placeholder="e.g. 1"
          className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded focus:ring-2 focus:ring-[var(--primary)]/20 bg-[var(--surface-2)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--primary)] transition-colors"
        />
      </div>

      {/* FED Payable */}
      <div className="col-span-6 md:col-span-2">
        <label className="block text-xs font-medium mb-1">FED Payable</label>
        <input
          type="number"
          step="0.01"
          {...register(getFieldName('fedPayable'), { valueAsNumber: true })}
          defaultValue={0}
          className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded focus:ring-2 focus:ring-[var(--primary)]/20 bg-[var(--surface-2)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors"
        />
      </div>

      {/* Hidden fields for optional FBR data (calculated fields set by LineItemsTable via setValue) */}
      <input type="hidden" {...register(getFieldName('fixedNotifiedValueOrRetailPrice'), { valueAsNumber: true })} value={0} />
      <input type="hidden" {...register(getFieldName('salesTaxWithheldAtSource'), { valueAsNumber: true })} value={0} />
      <input type="hidden" {...register(getFieldName('extraTax'), { valueAsNumber: true })} value={0} />
      <input type="hidden" {...register(getFieldName('furtherTax'), { valueAsNumber: true })} value={0} />
    </div>
  );
});
