// T023 [US2]: Invoice summary component to display calculated totals
'use client';

import { InvoiceCalculations } from '@/lib/invoices/calculations';

interface InvoiceSummaryProps {
  calculations: InvoiceCalculations | null;
  isCalculating?: boolean;
}

export function InvoiceSummary({ calculations, isCalculating = false }: InvoiceSummaryProps) {
  if (isCalculating) {
    return (
      <div className="bg-[var(--surface-2)] rounded-lg p-6 border border-[var(--border)]">
        <p className="text-[var(--foreground-muted)] text-center">Calculating...</p>
      </div>
    );
  }

  if (!calculations) {
    return (
      <div className="bg-[var(--surface-2)] rounded-lg p-6 border border-[var(--border)]">
        <p className="text-[var(--foreground-muted)] text-center">Add line items to see totals</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] shadow-sm">
      <div className="p-6 border-b border-[var(--border)]">
        <h3 className="text-lg font-semibold">Invoice Summary</h3>
      </div>

      <div className="p-6 space-y-4">
        {/* Line Item Count */}
        <div className="flex justify-between text-sm text-[var(--foreground-muted)]">
          <span>Total Line Items:</span>
          <span className="font-medium">{calculations.lineItemTotals.length}</span>
        </div>

        <div className="border-t border-[var(--border)] pt-4 space-y-3">
          {/* Subtotal */}
          <div className="flex justify-between">
            <span className="font-medium">Subtotal (excluding tax):</span>
            <span className="font-mono">
              PKR {calculations.subtotal.toLocaleString('en-PK', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          {/* Total Tax */}
          <div className="flex justify-between text-[var(--primary)]">
            <span className="font-medium">Total Sales Tax:</span>
            <span className="font-mono">
              PKR {calculations.totalTax.toLocaleString('en-PK', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          {/* Extra Taxes (if any) */}
          {calculations.totalExtraTax > 0 && (
            <div className="flex justify-between text-sm text-[var(--foreground-muted)]">
              <span>Extra Tax:</span>
              <span className="font-mono">
                PKR {calculations.totalExtraTax.toLocaleString('en-PK', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          )}

          {calculations.totalFurtherTax > 0 && (
            <div className="flex justify-between text-sm text-[var(--foreground-muted)]">
              <span>Further Tax:</span>
              <span className="font-mono">
                PKR {calculations.totalFurtherTax.toLocaleString('en-PK', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          )}
        </div>

        {/* Grand Total */}
        <div className="border-t-2 border-[var(--border)] pt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">Grand Total:</span>
            <span className="text-2xl font-bold text-[var(--positive)] font-mono">
              PKR {calculations.grandTotal.toLocaleString('en-PK', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* Tax Breakdown (optional, collapsible) */}
        {calculations.lineItemTotals.length > 1 && (
          <details className="border-t border-[var(--border)] pt-4">
            <summary className="cursor-pointer text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
              View line item breakdown
            </summary>
            <div className="mt-3 space-y-2">
              {calculations.lineItemTotals.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-[var(--foreground-muted)]">Line {index + 1}:</span>
                  <div className="text-right font-mono">
                    <div>
                      Subtotal: PKR {item.subtotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[var(--primary)]">
                      Tax: PKR {item.salesTax.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="font-semibold">
                      Total: PKR {item.lineTotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* FBR Compliance Note */}
        <div className="border-t border-[var(--border)] pt-4">
          <p className="text-xs text-[var(--foreground-muted)]">
            ✓ Calculations comply with FBR Digital Invoicing API v1.12
          </p>
        </div>
      </div>
    </div>
  );
}
