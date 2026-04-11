// InvoicePrint — print-optimized invoice layout
// Theme: website indigo palette, white/glass surfaces, business logo
// NO navigation, buttons, or interactive elements

import { QRCode } from './QRCode';
import type { Invoice, LineItem } from '@/lib/db/schema/invoices';

interface InvoicePrintProps {
  invoice: Invoice;
  lineItems: LineItem[];
  logoPath?: string | null;
}

function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '0.00';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function InvoicePrint({ invoice, lineItems, logoPath }: InvoicePrintProps) {
  const sortedItems = [...lineItems].sort((a, b) => a.lineNumber - b.lineNumber);

  return (
    <div className="invoice-print bg-white max-w-4xl mx-auto text-sm" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Gradient accent bar ── */}
      <div className="invoice-print-accent" style={{ height: 5, background: 'linear-gradient(90deg, #4f46e5 0%, #818cf8 50%, #c084fc 100%)' }} />

      {/* ── HEADER: business logo left | invoice type center | Easy Digital Invoice+FBR right ── */}
      <div className="invoice-print-header" style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e5ee',
        padding: '24px 36px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 16,
      }}>
        {/* Business logo + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12,
            border: '1px solid #e2e5ee',
            background: '#f5f6fa',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', flexShrink: 0,
          }}>
            {logoPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPath} alt="Business logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: 9, fontWeight: 700, color: '#c7d2fe', textAlign: 'center', lineHeight: 1.2 }}>
                {invoice.sellerBusinessName?.slice(0, 2).toUpperCase() ?? 'TX'}
              </span>
            )}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f1423', letterSpacing: '-0.3px' }}>
              {invoice.sellerBusinessName}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace', marginTop: 2 }}>
              NTN/CNIC: {invoice.sellerNTNCNIC}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
              {invoice.sellerProvince} · {invoice.sellerAddress}
            </div>
          </div>
        </div>

        {/* Invoice type badge (center) */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{
            display: 'inline-block',
            background: '#eef2ff', color: '#4f46e5',
            fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
            padding: '5px 16px', borderRadius: 999,
            border: '1px solid #c7d2fe',
          }}>
            {invoice.invoiceType}
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>{invoice.invoiceDate}</div>
        </div>

        {/* Easy Digital Invoice brand + FBR pill */}
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flex: 1 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0f1423', letterSpacing: '-0.5px' }}>
              Easy<span style={{ color: '#4f46e5' }}>Digital Invoice</span>
            </div>
            <div style={{ fontSize: 9, color: '#9ca3af', letterSpacing: '0.5px' }}>FBR-Compliant Invoicing</div>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: '#f8fafc', border: '1px solid #e2e5ee',
            borderRadius: 8, padding: '5px 10px',
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: 5,
              background: 'linear-gradient(135deg, #064e3b, #0d9488)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 7, fontWeight: 800, color: 'white',
            }}>FBR</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#374151' }}>Digital Invoicing</div>
              <div style={{ fontSize: 8, color: '#9ca3af' }}>v1.12 · Pakistan</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FBR Invoice Number band ── */}
      <div style={{
        background: '#fafbff',
        borderBottom: '1px solid #e0e7ff',
        padding: '14px 36px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6366f1' }}>
            FBR Invoice Number
          </div>
          {invoice.fbrInvoiceNumber ? (
            <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#312e81', marginTop: 3 }}>
              {invoice.fbrInvoiceNumber}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 3, fontStyle: 'italic' }}>
              Not yet submitted to FBR
            </div>
          )}
          {invoice.issuedAt && (
            <div style={{ fontSize: 10, color: '#818cf8', marginTop: 2 }}>
              Issued: {new Date(invoice.issuedAt).toLocaleString('en-PK')}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Status pill only — QR code moved to bottom-left footer */}
          {invoice.fbrInvoiceNumber ? (
            <span style={{
              background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46',
              fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
              padding: '4px 12px', borderRadius: 999,
            }}>✓ Issued</span>
          ) : (
            <span style={{
              background: '#fefce8', border: '1px solid #fde68a', color: '#92400e',
              fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
              padding: '4px 12px', borderRadius: 999,
            }}>Draft</span>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ padding: '24px 36px' }}>

        {/* Meta chips */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap' as const }}>
          {[
            { label: 'Invoice Date', value: invoice.invoiceDate },
            { label: 'Invoice Type', value: invoice.invoiceType },
            ...(invoice.issuedAt
              ? [{ label: 'Issued At', value: new Date(invoice.issuedAt).toLocaleDateString('en-PK') }]
              : []),
            ...(invoice.invoiceRefNo
              ? [{ label: 'Reference No.', value: invoice.invoiceRefNo }]
              : []),
          ].map((chip) => (
            <div key={chip.label} style={{
              background: '#f8fafc', border: '1px solid #e2e5ee',
              borderRadius: 10, padding: '7px 14px',
              display: 'flex', flexDirection: 'column', gap: 2,
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af' }}>
                {chip.label}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{chip.value}</span>
            </div>
          ))}
        </div>

        {/* Seller / Buyer cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 26 }}>
          {/* Seller */}
          <div style={{ borderRadius: 14, border: '1px solid #e2e5ee', overflow: 'hidden', background: 'white' }}>
            <div style={{
              padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 7,
              background: 'linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)',
              borderBottom: '1px solid #e0e7ff',
              fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#4f46e5',
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4f46e5' }} />
              Seller
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f1423', marginBottom: 5 }}>
                {invoice.sellerBusinessName}
              </div>
              <div style={{ fontSize: 11, color: '#0f1423', fontFamily: 'monospace', fontWeight: 600 }}>
                NTN/CNIC: {invoice.sellerNTNCNIC}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2, lineHeight: 1.65 }}>
                {invoice.sellerProvince}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.65 }}>{invoice.sellerAddress}</div>
            </div>
          </div>

          {/* Buyer */}
          <div style={{ borderRadius: 14, border: '1px solid #e2e5ee', overflow: 'hidden', background: 'white' }}>
            <div style={{
              padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 7,
              background: 'linear-gradient(135deg, #f8faff 0%, #f0f9ff 100%)',
              borderBottom: '1px solid #bae6fd',
              fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#0284c7',
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0284c7' }} />
              Buyer
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f1423', marginBottom: 5 }}>
                {invoice.buyerBusinessName}
              </div>
              {invoice.buyerNTNCNIC && (
                <div style={{ fontSize: 11, color: '#0f1423', fontFamily: 'monospace', fontWeight: 600 }}>
                  NTN/CNIC: {invoice.buyerNTNCNIC}
                </div>
              )}
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2, lineHeight: 1.65 }}>
                {invoice.buyerProvince}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.65 }}>{invoice.buyerAddress}</div>
              {invoice.buyerRegistrationType && (
                <span style={{
                  display: 'inline-block', marginTop: 6,
                  background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8',
                  fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                  padding: '2px 9px', borderRadius: 999,
                }}>
                  {invoice.buyerRegistrationType}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#9ca3af', marginBottom: 10 }}>
          Line Items
        </div>
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e5ee', marginBottom: 22 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>
                {['#', 'Description', 'HS Code', 'Qty / UOM', 'Rate', 'Value excl. ST', 'Sales Tax', 'Total'].map((h, i) => (
                  <th key={h} style={{
                    padding: '10px 10px', textAlign: i >= 3 ? 'right' : 'left',
                    fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                    color: 'rgba(255,255,255,.85)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item, i) => (
                <tr key={item.id} style={{
                  background: i % 2 === 1 ? '#fafbff' : '#ffffff',
                  borderBottom: i < sortedItems.length - 1 ? '1px solid #f1f5f9' : 'none',
                }}>
                  <td style={{ padding: '10px 10px', color: '#334155' }}>{item.lineNumber}</td>
                  <td style={{ padding: '10px 10px', color: '#334155' }}>{item.productDescription}</td>
                  <td style={{ padding: '10px 10px', fontFamily: 'monospace', fontSize: 11, color: '#334155' }}>{item.hsCode}</td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', color: '#334155' }}>
                    {parseFloat(item.quantity).toFixed(2)} {item.uom}
                  </td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', color: '#334155' }}>{item.rate}</td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', color: '#334155' }}>
                    {formatCurrency(item.valueSalesExcludingST)}
                  </td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', color: '#334155' }}>
                    {formatCurrency(item.salesTaxApplicable)}
                  </td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 700, color: '#4f46e5' }}>
                    PKR {formatCurrency(item.totalValues)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="invoice-print-totals" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <div style={{ width: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#6b7280', borderBottom: '1px solid #f1f5f9' }}>
              <span>Subtotal</span><span>PKR {formatCurrency(invoice.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#6b7280', borderBottom: '1px solid #f1f5f9' }}>
              <span>Total Sales Tax</span><span>PKR {formatCurrency(invoice.totalTax)}</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '12px 16px', marginTop: 8,
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              borderRadius: 12, fontWeight: 800, fontSize: 16, color: 'white',
            }}>
              <span>Grand Total</span><span>PKR {formatCurrency(invoice.grandTotal)}</span>
            </div>
          </div>
        </div>

      </div>{/* /body */}

      {/* ── FOOTER ── */}
      <div className="invoice-print-footer" style={{
        background: '#f8fafc', borderTop: '1px solid #e2e5ee',
        padding: '16px 36px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        fontSize: 10, color: '#9ca3af',
      }}>
        {/* QR code — bottom left */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}>
          {invoice.fbrInvoiceNumber ? (
            <>
              <QRCode value={invoice.fbrInvoiceNumber} size={72} />
              <span style={{ fontSize: 8, color: '#a5b4fc' }}>Scan to verify FBR invoice</span>
            </>
          ) : (
            <span style={{ fontWeight: 700, color: '#6b7280' }}>
              Tax<span style={{ color: '#4f46e5' }}>Digital</span>
            </span>
          )}
        </div>

        {/* Center branding */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, color: '#6b7280', marginBottom: 2 }}>
            Tax<span style={{ color: '#4f46e5' }}>Digital</span>
          </div>
          <div>FBR Digital Invoicing System v1.12 · Pakistan Revenue Service</div>
        </div>

        {/* FBR number — bottom right */}
        <div style={{ textAlign: 'right' }}>
          {invoice.fbrInvoiceNumber && (
            <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#6b7280' }}>
              {invoice.fbrInvoiceNumber}
            </span>
          )}
        </div>
      </div>

    </div>
  );
}
