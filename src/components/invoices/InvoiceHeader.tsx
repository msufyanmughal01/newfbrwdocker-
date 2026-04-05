// T020 [US1]: Invoice header component for invoice type, dates, seller/buyer fields
'use client';

import { UseFormReturn } from 'react-hook-form';
import { InvoiceFormData } from '@/lib/invoices/validation';
import { FBR_PROVINCES } from '@/lib/invoices/fbr-reference-data';
import { NTNVerifier } from './NTNVerifier';
import { BuyerSearch } from './BuyerSearch';
import { ClientSearch } from './ClientSearch';
import { FBRErrorBoundary } from './FBRErrorBoundary';
import { useState, useEffect } from 'react';

interface InvoiceHeaderProps {
  form: UseFormReturn<InvoiceFormData>;
}

const inputBase = 'w-full px-3 py-2.5 border rounded-lg bg-[var(--surface-2)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15 focus:border-[var(--primary)] transition-colors';
const inputNormal = `${inputBase} border-[var(--border)]`;
const inputError = `${inputBase} border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error)]/15 bg-[var(--error-bg)]`;

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-2">
      <div className="h-4 w-0.5 rounded-full bg-[var(--primary)] flex-shrink-0" />
      <span className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

function FieldLabel({ htmlFor, children, required }: { htmlFor?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
      {children}
      {required && <span className="text-[var(--error)] ml-0.5">*</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[var(--error)] text-xs mt-1.5">{message}</p>;
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-[var(--foreground-subtle)] text-xs mt-1.5">{children}</p>;
}

export function InvoiceHeader({ form }: InvoiceHeaderProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = form;

  const invoiceType = watch('invoiceType');
  const buyerRegistrationType = watch('buyerRegistrationType');
  const buyerNTNCNIC = watch('buyerNTNCNIC');

  const [provinces, setProvinces] = useState<string[]>([...FBR_PROVINCES]);
  useEffect(() => {
    fetch('/api/fbr/reference/provinces')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.provinces?.length > 0) setProvinces(data.provinces);
      })
      .catch(() => { /* keep static fallback */ });
  }, []);

  return (
    <div className="space-y-6">
      {/* Invoice Type and Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="invoiceType" required>Invoice Type</FieldLabel>
          <select
            id="invoiceType"
            {...register('invoiceType')}
            className={errors.invoiceType ? inputError : inputNormal}
          >
            <option value="Sale Invoice">Sale Invoice</option>
            <option value="Debit Note">Debit Note</option>
          </select>
          <FieldError message={errors.invoiceType?.message} />
        </div>

        <div>
          <FieldLabel htmlFor="invoiceDate" required>Invoice Date</FieldLabel>
          <input
            type="date"
            id="invoiceDate"
            {...register('invoiceDate')}
            className={errors.invoiceDate ? inputError : inputNormal}
          />
          <FieldError message={errors.invoiceDate?.message} />
        </div>
      </div>

      {/* Debit Note Reference (conditional) */}
      {invoiceType === 'Debit Note' && (
        <div>
          <FieldLabel htmlFor="invoiceRefNo" required>Invoice Reference Number</FieldLabel>
          <input
            type="text"
            id="invoiceRefNo"
            {...register('invoiceRefNo')}
            placeholder="22 or 28 digits"
            maxLength={28}
            className={`${errors.invoiceRefNo ? inputError : inputNormal} font-mono`}
          />
          {errors.invoiceRefNo
            ? <FieldError message={errors.invoiceRefNo.message} />
            : <FieldHint>Enter 22 digits (NTN-based) or 28 digits (CNIC-based)</FieldHint>
          }
        </div>
      )}

      {/* ── Seller Information ─────────────────────────────────── */}
      <div>
        <SectionHeader label="Seller Information" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="sellerNTNCNIC" required>NTN / CNIC</FieldLabel>
            <input
              type="text"
              id="sellerNTNCNIC"
              {...register('sellerNTNCNIC')}
              placeholder="7-digit NTN or 13-digit CNIC"
              maxLength={13}
              className={`${errors.sellerNTNCNIC ? inputError : inputNormal} font-mono`}
            />
            {errors.sellerNTNCNIC
              ? <FieldError message={errors.sellerNTNCNIC.message} />
              : <FieldHint>e.g. 0786909 (NTN) or 1234567890123 (CNIC)</FieldHint>
            }
          </div>

          <div>
            <FieldLabel htmlFor="sellerBusinessName" required>Business Name</FieldLabel>
            <input
              type="text"
              id="sellerBusinessName"
              {...register('sellerBusinessName')}
              className={errors.sellerBusinessName ? inputError : inputNormal}
            />
            <FieldError message={errors.sellerBusinessName?.message} />
          </div>

          <div>
            <FieldLabel htmlFor="sellerProvince" required>Province</FieldLabel>
            <select
              id="sellerProvince"
              {...register('sellerProvince')}
              className={errors.sellerProvince ? inputError : inputNormal}
            >
              <option value="">Select Province</option>
              {provinces.map((province) => (
                <option key={province} value={province}>{province}</option>
              ))}
            </select>
            <FieldError message={errors.sellerProvince?.message} />
          </div>

          <div>
            <FieldLabel htmlFor="sellerAddress" required>Address</FieldLabel>
            <input
              type="text"
              id="sellerAddress"
              {...register('sellerAddress')}
              className={errors.sellerAddress ? inputError : inputNormal}
            />
            <FieldError message={errors.sellerAddress?.message} />
          </div>
        </div>
      </div>

      {/* ── Buyer Information ──────────────────────────────────── */}
      <div>
        <SectionHeader label="Buyer Information" />

        {/* Quick-fill from saved clients */}
        <div className="mb-4">
          <FieldLabel>Quick-fill from saved clients</FieldLabel>
          <ClientSearch form={form} />
        </div>

        {/* Registration type */}
        <div className="mb-4">
          <FieldLabel required>Registration Type</FieldLabel>
          <div className="flex gap-6">
            {(['Registered', 'Unregistered'] as const).map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value={type}
                  {...register('buyerRegistrationType')}
                  className="w-4 h-4 accent-[var(--primary)]"
                />
                <span className="text-sm text-[var(--foreground)]">{type}</span>
              </label>
            ))}
          </div>
          <FieldError message={errors.buyerRegistrationType?.message} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="buyerNTNCNIC" required={buyerRegistrationType === 'Registered'}>
              NTN / CNIC
            </FieldLabel>
            <input
              type="text"
              id="buyerNTNCNIC"
              {...register('buyerNTNCNIC')}
              placeholder="7-digit NTN or 13-digit CNIC"
              maxLength={13}
              className={`${errors.buyerNTNCNIC ? inputError : inputNormal} font-mono`}
            />
            <FieldError message={errors.buyerNTNCNIC?.message} />
            {buyerNTNCNIC && buyerNTNCNIC.length >= 7 && (
              <NTNVerifier form={form} ntnCnic={buyerNTNCNIC} />
            )}
            {!errors.buyerNTNCNIC && (
              <FieldHint>
                {buyerRegistrationType === 'Registered'
                  ? 'e.g. 0786909 (NTN) or 1234567890123 (CNIC)'
                  : 'Optional for unregistered buyers'}
              </FieldHint>
            )}
          </div>

          <div>
            <FieldLabel>Business Name</FieldLabel>
            <div className="space-y-2">
              <p className="text-xs text-[var(--foreground-muted)]">Search FBR registry:</p>
              <FBRErrorBoundary>
                <BuyerSearch form={form} />
              </FBRErrorBoundary>
            </div>
            <FieldError message={errors.buyerBusinessName?.message} />
          </div>

          <div>
            <FieldLabel htmlFor="buyerProvince">Province</FieldLabel>
            <select
              id="buyerProvince"
              {...register('buyerProvince')}
              className={errors.buyerProvince ? inputError : inputNormal}
            >
              <option value="">Select Province</option>
              {provinces.map((province) => (
                <option key={province} value={province}>{province}</option>
              ))}
            </select>
            <FieldError message={errors.buyerProvince?.message} />
          </div>

          <div>
            <FieldLabel htmlFor="buyerAddress">Address</FieldLabel>
            <input
              type="text"
              id="buyerAddress"
              {...register('buyerAddress')}
              className={errors.buyerAddress ? inputError : inputNormal}
            />
            <FieldError message={errors.buyerAddress?.message} />
          </div>
        </div>
      </div>
    </div>
  );
}
