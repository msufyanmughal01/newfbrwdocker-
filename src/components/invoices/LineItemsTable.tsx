// T022 [US3]: Line items table with useFieldArray for dynamic add/remove
'use client';

import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { InvoiceFormData } from '@/lib/invoices/validation';
import { LineItemRow } from './LineItemRow';
import { calculateLineItem } from '@/lib/invoices/calculations';
import { FBR_UOM_OPTIONS, FBR_TAX_RATES } from '@/lib/invoices/fbr-reference-data';
import { useMemo, useEffect, useState } from 'react';
import type { TaxRateOption } from '@/lib/fbr/reference/tax-rates';

interface LineItemsTableProps {
  form: UseFormReturn<InvoiceFormData>;
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
} as const;

export function LineItemsTable({ form }: LineItemsTableProps) {
  const { control, watch, setValue } = form;

  // T052-T053: Fetch UOM and tax rates from live FBR API with static fallback
  const [uomOptions, setUomOptions] = useState<string[]>([...FBR_UOM_OPTIONS]);
  const [taxRateOptions, setTaxRateOptions] = useState<TaxRateOption[]>([...FBR_TAX_RATES]);

  useEffect(() => {
    fetch('/api/fbr/reference/uom')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.uoms?.length > 0) setUomOptions(data.uoms); })
      .catch(() => { /* keep static fallback */ });

    fetch('/api/fbr/reference/tax-rates')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.rates?.length > 0) setTaxRateOptions(data.rates); })
      .catch(() => { /* keep static fallback */ });
  }, []);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Watch all items for calculation
  const items = watch('items') || [];

  // Force re-calculation by stringifying items to detect deep changes
  const itemsKey = JSON.stringify(items);

  // Calculate line item values (memoized)
  const lineItemCalculations = useMemo(() => {
    if (!items || items.length === 0) return [];
    return items.map((item) => {
      try {
        return calculateLineItem(item);
      } catch {
        return { salesTax: 0, lineTotal: 0, subtotal: 0 };
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey]);

  const lineItemSalesTax = useMemo(() => {
    return lineItemCalculations.map((calc) => calc.salesTax);
  }, [lineItemCalculations]);

  // Sync calculated values back to form state
  useEffect(() => {
    lineItemCalculations.forEach((calc, index) => {
      setValue(`items.${index}.salesTaxApplicable`, calc.salesTax, {
        shouldValidate: false,
        shouldDirty: false,
      });
      setValue(`items.${index}.totalValues`, calc.lineTotal, {
        shouldValidate: false,
        shouldDirty: false,
      });
    });
  }, [lineItemCalculations, setValue]);

  const handleAddItem = () => {
    if (fields.length < 100) {
      append(DEFAULT_LINE_ITEM);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    } else {
      alert('At least one line item is required');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Line Items ({fields.length}/100)
        </h3>
        <button
          type="button"
          onClick={handleAddItem}
          disabled={fields.length >= 100}
          className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded disabled:bg-[var(--surface-3)] disabled:cursor-not-allowed transition"
        >
          + Add Line Item
        </button>
      </div>

      {fields.length === 0 && (
        <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-8 text-center">
          <p className="text-[var(--foreground-muted)] mb-4">No line items yet</p>
          <button
            type="button"
            onClick={handleAddItem}
            className="px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition"
          >
            Add First Line Item
          </button>
        </div>
      )}

      <div className="space-y-4">
        {fields.map((field, index) => (
          <LineItemRow
            key={field.id}
            form={form}
            index={index}
            onRemove={() => handleRemoveItem(index)}
            calculatedTotal={lineItemSalesTax[index]}
            uomOptions={uomOptions}
            taxRateOptions={taxRateOptions}
          />
        ))}
      </div>

      {fields.length > 0 && fields.length < 100 && (
        <button
          type="button"
          onClick={handleAddItem}
          className="w-full py-3 border-2 border-dashed border-[var(--border)] rounded-lg text-[var(--foreground-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition"
        >
          + Add Another Line Item
        </button>
      )}

      {fields.length >= 100 && (
        <p className="text-[var(--warning)] text-sm text-center">
          Maximum of 100 line items reached
        </p>
      )}
    </div>
  );
}
