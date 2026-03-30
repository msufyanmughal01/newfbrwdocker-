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

export function InvoiceHeader({ form }: InvoiceHeaderProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = form;

  const invoiceType = watch('invoiceType');
  const buyerRegistrationType = watch('buyerRegistrationType');
  const buyerNTNCNIC = watch('buyerNTNCNIC');

  // T051: Live provinces from FBR API with static fallback
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
          <label htmlFor="invoiceType" className="block text-sm font-medium mb-1">
            Invoice Type <span className="text-[var(--error)]">*</span>
          </label>
          <select
            id="invoiceType"
            {...register('invoiceType')}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 bg-[var(--surface-2)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 transition-colors ${
              errors.invoiceType
                ? 'border-[var(--error)] focus:ring-[var(--error)] bg-[var(--error-bg)]'
                : 'border-[var(--border)] focus:ring-[var(--primary)]'
            }`}
          >
            <option value="Sale Invoice">Sale Invoice</option>
            <option value="Debit Note">Debit Note</option>
          </select>
          {errors.invoiceType && (
            <p className="text-[var(--error)] text-sm mt-1">{errors.invoiceType.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="invoiceDate" className="block text-sm font-medium mb-1">
            Invoice Date <span className="text-[var(--error)]">*</span>
          </label>
          <input
            type="date"
            id="invoiceDate"
            {...register('invoiceDate')}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 bg-[var(--surface-2)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 transition-colors ${
              errors.invoiceDate
                ? 'border-[var(--error)] focus:ring-[var(--error)] bg-[var(--error-bg)]'
                : 'border-[var(--border)] focus:ring-[var(--primary)]'
            }`}
          />
          {errors.invoiceDate && (
            <p className="text-[var(--error)] text-sm mt-1">{errors.invoiceDate.message}</p>
          )}
        </div>
      </div>

      {/* Debit Note Reference (conditional) */}
      {invoiceType === 'Debit Note' && (
        <div>
          <label htmlFor="invoiceRefNo" className="block text-sm font-medium mb-1">
            Invoice Reference Number <span className="text-[var(--error)]">*</span>
          </label>
          <input
            type="text"
            id="invoiceRefNo"
            {...register('invoiceRefNo')}
            placeholder="22 or 28 digits"
            maxLength={28}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 bg-[var(--surface-2)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 transition-colors ${
              errors.invoiceRefNo
                ? 'border-[var(--error)] focus:ring-[var(--error)] bg-[var(--error-bg)]'
                : 'border-[var(--border)] focus:ring-[var(--primary)]'
            }`}
          />
          {errors.invoiceRefNo ? (
            <p className="text-[var(--error)] text-sm mt-1">
              <span className="inline-block mr-1">❌</span>
              {errors.invoiceRefNo.message}
            </p>
          ) : (
            <p className="text-[var(--foreground-muted)] text-xs mt-1">
              ℹ️ Enter 22 digits (for NTN-based invoices) or 28 digits (for CNIC-based invoices)
            </p>
          )}
        </div>
      )}

      {/* Seller Information */}
      <div className="border-t border-[var(--border)] pt-4">
        <h3 className="text-lg font-semibold mb-4">Seller Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sellerNTNCNIC" className="block text-sm font-medium mb-1">
              Seller NTN/CNIC <span className="text-[var(--error)]">*</span>
            </label>
            <input
              type="text"
              id="sellerNTNCNIC"
              {...register('sellerNTNCNIC')}
              placeholder="7-digit NTN or 13-digit CNIC"
              maxLength={13}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 bg-[var(--surface-2)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 transition-colors ${
                errors.sellerNTNCNIC
                  ? 'border-[var(--error)] focus:ring-[var(--error)] bg-[var(--error-bg)]'
                  : 'border-[var(--border)] focus:ring-[var(--primary)]'
              }`}
            />
            {errors.sellerNTNCNIC ? (
              <p className="text-[var(--error)] text-sm mt-1">
                <span className="inline-block mr-1">❌</span>
                {errors.sellerNTNCNIC.message}
              </p>
            ) : (
              <p className="text-[var(--foreground-muted)] text-xs mt-1">
                ℹ️ Enter 7-digit NTN (e.g., 0786909) or 13-digit CNIC (e.g., 1234567890123)
              </p>
            )}
          </div>

          <div>
            <label htmlFor="sellerBusinessName" className="block text-sm font-medium mb-1">
              Business Name <span className="text-[var(--error)]">*</span>
            </label>
            <input
              type="text"
              id="sellerBusinessName"
              {...register('sellerBusinessName')}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 bg-[var(--surface-2)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 transition-colors ${
                errors.sellerBusinessName
                  ? 'border-[var(--error)] focus:ring-[var(--error)] bg-[var(--error-bg)]'
                  : 'border-[var(--border)] focus:ring-[var(--primary)]'
              }`}
            />
            {errors.sellerBusinessName && (
              <p className="text-[var(--error)] text-sm mt-1">{errors.sellerBusinessName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="sellerProvince" className="block text-sm font-medium mb-1">
              Province <span className="text-[var(--error)]">*</span>
            </label>
            <select
              id="sellerProvince"
              {...register('sellerProvince')}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 bg-[var(--surface-2)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 transition-colors ${
                errors.sellerProvince
                  ? 'border-[var(--error)] focus:ring-[var(--error)] bg-[var(--error-bg)]'
                  : 'border-[var(--border)] focus:ring-[var(--primary)]'
              }`}
            >
              <option value="">Select Province</option>
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
            {errors.sellerProvince && (
              <p className="text-[var(--error)] text-sm mt-1">{errors.sellerProvince.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="sellerAddress" className="block text-sm font-medium mb-1">
              Address <span className="text-[var(--error)]">*</span>
            </label>
            <input
              type="text"
              id="sellerAddress"
              {...register('sellerAddress')}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 bg-[var(--surface-2)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 transition-colors ${
                errors.sellerAddress
                  ? 'border-[var(--error)] focus:ring-[var(--error)] bg-[var(--error-bg)]'
                  : 'border-[var(--border)] focus:ring-[var(--primary)]'
              }`}
            />
            {errors.sellerAddress && (
              <p className="text-[var(--error)] text-sm mt-1">{errors.sellerAddress.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Buyer Information */}
      <div className="border-t border-[var(--border)] pt-4">
        <h3 className="text-lg font-semibold mb-4">Buyer Information</h3>

        {/* T019/T021: Saved client selector — full-width, at top of section for discoverability */}
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Quick-fill from saved clients</p>
          <ClientSearch form={form} />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Registration Type <span className="text-[var(--error)]">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="Registered"
                {...register('buyerRegistrationType')}
                className="mr-2"
              />
              Registered
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="Unregistered"
                {...register('buyerRegistrationType')}
                className="mr-2"
              />
              Unregistered
            </label>
          </div>
          {errors.buyerRegistrationType && (
            <p className="text-[var(--error)] text-sm mt-1">{errors.buyerRegistrationType.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="buyerNTNCNIC" className="block text-sm font-medium mb-1">
              Buyer NTN/CNIC {buyerRegistrationType === 'Registered' && <span className="text-[var(--error)]">*</span>}
            </label>
            <input
              type="text"
              id="buyerNTNCNIC"
              {...register('buyerNTNCNIC')}
              placeholder="7-digit NTN or 13-digit CNIC"
              maxLength={13}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 bg-[var(--surface-2)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 transition-colors ${
                errors.buyerNTNCNIC
                  ? 'border-[var(--error)] focus:ring-[var(--error)] bg-[var(--error-bg)]'
                  : 'border-[var(--border)] focus:ring-[var(--primary)]'
              }`}
            />
            {errors.buyerNTNCNIC ? (
              <p className="text-[var(--error)] text-sm mt-1">
                <span className="inline-block mr-1">❌</span>
                {errors.buyerNTNCNIC.message}
              </p>
            ) : null}
            {/* T038: NTN Verifier badge */}
            {buyerNTNCNIC && buyerNTNCNIC.length >= 7 && (
              <NTNVerifier form={form} ntnCnic={buyerNTNCNIC} />
            )}
            {!errors.buyerNTNCNIC && buyerRegistrationType === 'Registered' ? (
              <p className="text-[var(--foreground-muted)] text-xs mt-1">
                ℹ️ Enter 7-digit NTN (e.g., 0786909) or 13-digit CNIC (e.g., 1234567890123)
              </p>
            ) : (
              <p className="text-[var(--foreground-subtle)] text-xs mt-1">
                ℹ️ Optional for unregistered buyers
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Business Name
            </label>
            {/* T020: ClientSearch moved to top of section — removed from here */}
            {/* FBR Buyer Registry search — T023: unchanged, still in original position */}
            <div>
              <p className="text-xs text-[var(--foreground-muted)] mb-1">Or search FBR registry:</p>
              <FBRErrorBoundary>
                <BuyerSearch form={form} />
              </FBRErrorBoundary>
            </div>
            {errors.buyerBusinessName && (
              <p className="text-[var(--error)] text-sm mt-1">{errors.buyerBusinessName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="buyerProvince" className="block text-sm font-medium mb-1">
              Province
            </label>
            <select
              id="buyerProvince"
              {...register('buyerProvince')}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 bg-[var(--surface-2)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 transition-colors ${
                errors.buyerProvince
                  ? 'border-[var(--error)] focus:ring-[var(--error)] bg-[var(--error-bg)]'
                  : 'border-[var(--border)] focus:ring-[var(--primary)]'
              }`}
            >
              <option value="">Select Province</option>
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
            {errors.buyerProvince && (
              <p className="text-[var(--error)] text-sm mt-1">{errors.buyerProvince.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="buyerAddress" className="block text-sm font-medium mb-1">
              Address
            </label>
            <input
              type="text"
              id="buyerAddress"
              {...register('buyerAddress')}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 bg-[var(--surface-2)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 transition-colors ${
                errors.buyerAddress
                  ? 'border-[var(--error)] focus:ring-[var(--error)] bg-[var(--error-bg)]'
                  : 'border-[var(--border)] focus:ring-[var(--primary)]'
              }`}
            />
            {errors.buyerAddress && (
              <p className="text-[var(--error)] text-sm mt-1">{errors.buyerAddress.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
