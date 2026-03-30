// InvoicePrint — print-optimized invoice layout
// Contains: seller/buyer info, line items, totals, FBR invoice number, QR code, FBR logo
// NO navigation, buttons, or interactive elements

import Image from 'next/image';
import { QRCode } from './QRCode';
import type { Invoice, LineItem } from '@/lib/db/schema/invoices';

interface InvoicePrintProps {
  invoice: Invoice;
  lineItems: LineItem[];
}

function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '0.00';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function InvoicePrint({ invoice, lineItems }: InvoicePrintProps) {
  const sortedItems = [...lineItems].sort((a, b) => a.lineNumber - b.lineNumber);

  return (
    <div className="invoice-print bg-[var(--surface)] p-8 max-w-4xl mx-auto text-sm text-[var(--foreground)]">
      {/* Header Row: FBR Logo + Title + QR Code */}
      <div className="flex justify-between items-start mb-6 border-b-2 border-[var(--primary)] pb-4">
        <div className="flex items-start gap-4">
          <Image
            src="/fbr-logo.svg"
            alt="FBR Digital Invoicing System"
            width={160}
            height={48}
            className="object-contain"
            unoptimized
          />
          <div>
            <h1 className="text-xl font-bold text-[var(--primary)]">
              {invoice.invoiceType}
            </h1>
            <p className="text-xs text-[var(--foreground-muted)]">FBR Digital Invoicing System v1.12</p>
          </div>
        </div>

        {/* QR Code — FBR mandated 1.0×1.0 inch */}
        {invoice.fbrInvoiceNumber && (
          <div className="text-right">
            <QRCode value={invoice.fbrInvoiceNumber} size={96} />
            <p className="text-xs text-[var(--foreground-subtle)] mt-1">Scan to verify</p>
          </div>
        )}
      </div>

      {/* FBR Invoice Number (prominent) */}
      {invoice.fbrInvoiceNumber && (
        <div className="mb-4 rounded bg-[var(--surface-2)] border border-[var(--primary)] px-4 py-2">
          <span className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide">
            FBR Invoice Number:{' '}
          </span>
          <span className="font-mono font-bold text-[var(--primary)] text-base">
            {invoice.fbrInvoiceNumber}
          </span>
          {invoice.issuedAt && (
            <span className="ml-4 text-xs text-[var(--primary)]">
              Issued: {new Date(invoice.issuedAt).toLocaleString('en-PK')}
            </span>
          )}
        </div>
      )}

      {/* Invoice Metadata */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase mb-1">Invoice Date</p>
          <p className="font-medium">{invoice.invoiceDate}</p>
          {invoice.invoiceRefNo && (
            <>
              <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase mt-2 mb-1">Reference No.</p>
              <p className="font-medium font-mono">{invoice.invoiceRefNo}</p>
            </>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase mb-1">Invoice ID</p>
          <p className="font-mono text-xs text-[var(--foreground-muted)]">{invoice.id}</p>
        </div>
      </div>

      {/* Seller / Buyer */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Seller */}
        <div className="rounded border border-[var(--border)] p-4">
          <p className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wide mb-2">Seller</p>
          <p className="font-bold">{invoice.sellerBusinessName}</p>
          <p className="text-xs text-[var(--foreground-muted)] font-mono">NTN/CNIC: {invoice.sellerNTNCNIC}</p>
          <p className="text-xs text-[var(--foreground-muted)]">{invoice.sellerProvince}</p>
          <p className="text-xs text-[var(--foreground-muted)]">{invoice.sellerAddress}</p>
        </div>

        {/* Buyer */}
        <div className="rounded border border-[var(--border)] p-4">
          <p className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wide mb-2">Buyer</p>
          <p className="font-bold">{invoice.buyerBusinessName}</p>
          {invoice.buyerNTNCNIC && (
            <p className="text-xs text-[var(--foreground-muted)] font-mono">NTN/CNIC: {invoice.buyerNTNCNIC}</p>
          )}
          <p className="text-xs text-[var(--foreground-muted)]">
            {invoice.buyerRegistrationType} • {invoice.buyerProvince}
          </p>
          <p className="text-xs text-[var(--foreground-muted)]">{invoice.buyerAddress}</p>
        </div>
      </div>

      {/* Line Items Table */}
      <table className="w-full border-collapse mb-6 text-xs">
        <thead>
          <tr className="bg-[var(--primary)] text-white">
            <th className="border border-[var(--primary)] px-2 py-1 text-left w-6">#</th>
            <th className="border border-[var(--primary)] px-2 py-1 text-left w-24">HS Code</th>
            <th className="border border-[var(--primary)] px-2 py-1 text-left">Description</th>
            <th className="border border-[var(--primary)] px-2 py-1 text-right w-16">Qty</th>
            <th className="border border-[var(--primary)] px-2 py-1 text-left w-12">UOM</th>
            <th className="border border-[var(--primary)] px-2 py-1 text-right w-20">Value (excl. ST)</th>
            <th className="border border-[var(--primary)] px-2 py-1 text-right w-16">Rate</th>
            <th className="border border-[var(--primary)] px-2 py-1 text-right w-20">Sales Tax</th>
            <th className="border border-[var(--primary)] px-2 py-1 text-right w-20">Total</th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item, i) => (
            <tr key={item.id} className={i % 2 === 0 ? 'bg-[var(--surface)]' : 'bg-[var(--surface-2)]'}>
              <td className="border border-[var(--border)] px-2 py-1">{item.lineNumber}</td>
              <td className="border border-[var(--border)] px-2 py-1 font-mono">{item.hsCode}</td>
              <td className="border border-[var(--border)] px-2 py-1">{item.productDescription}</td>
              <td className="border border-[var(--border)] px-2 py-1 text-right">{parseFloat(item.quantity).toFixed(2)}</td>
              <td className="border border-[var(--border)] px-2 py-1">{item.uom}</td>
              <td className="border border-[var(--border)] px-2 py-1 text-right">
                PKR {formatCurrency(item.valueSalesExcludingST)}
              </td>
              <td className="border border-[var(--border)] px-2 py-1 text-right">{item.rate}</td>
              <td className="border border-[var(--border)] px-2 py-1 text-right">
                PKR {formatCurrency(item.salesTaxApplicable)}
              </td>
              <td className="border border-[var(--border)] px-2 py-1 text-right font-semibold">
                PKR {formatCurrency(item.totalValues)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-72">
          <div className="flex justify-between py-1 border-b border-[var(--border)]">
            <span className="text-[var(--foreground-muted)]">Subtotal</span>
            <span className="font-medium">PKR {formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[var(--border)]">
            <span className="text-[var(--foreground-muted)]">Total Sales Tax</span>
            <span className="font-medium">PKR {formatCurrency(invoice.totalTax)}</span>
          </div>
          <div className="flex justify-between py-2 border-t-2 border-[var(--primary)]">
            <span className="font-bold text-[var(--primary)]">Grand Total</span>
            <span className="font-bold text-[var(--primary)] text-base">PKR {formatCurrency(invoice.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--border)] pt-4 text-center">
        <p className="text-xs text-[var(--foreground-subtle)]">
          Generated by FBR Digital Invoicing System — Pakistan Revenue Service
          {invoice.fbrInvoiceNumber && (
            <> · FBR Invoice: <span className="font-mono">{invoice.fbrInvoiceNumber}</span></>
          )}
        </p>
      </div>
    </div>
  );
}
