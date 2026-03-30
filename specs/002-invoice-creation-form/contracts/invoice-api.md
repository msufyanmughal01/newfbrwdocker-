# API Contracts: Invoice Creation Form

**Branch**: `002-invoice-creation-form` | **Date**: 2026-02-14 | **Spec**: [../spec.md](../spec.md)

## Purpose

This document defines the API contracts for invoice creation, validation, and draft management, including complete Zod validation schemas, request/response formats, and error codes.

## Table of Contents

1. [Validation Schemas (Zod)](#validation-schemas-zod)
2. [POST /api/invoices - Create Invoice](#post-apiinvoices---create-invoice)
3. [POST /api/invoices/validate - Validate Invoice](#post-apiinvoicesvalidate---validate-invoice)
4. [GET /api/drafts - List Drafts](#get-apidrafts---list-drafts)
5. [POST /api/drafts - Save Draft](#post-apidrafts---save-draft)
6. [DELETE /api/drafts/:id - Delete Draft](#delete-apidraftsid---delete-draft)
7. [Error Codes](#error-codes)

---

## Validation Schemas (Zod)

**Location**: `src/lib/invoices/validation.ts`

### Base Schemas

```typescript
import { z } from 'zod';

// NTN/CNIC validation
export const ntnSchema = z.string().regex(/^\d{7}$/, {
  message: 'NTN must be exactly 7 digits',
});

export const cnicSchema = z.string().regex(/^\d{13}$/, {
  message: 'CNIC must be exactly 13 digits',
});

export const ntnOrCnicSchema = z.union([ntnSchema, cnicSchema], {
  errorMap: () => ({ message: 'Must be a valid NTN (7 digits) or CNIC (13 digits)' }),
});

// Optional NTN/CNIC for unregistered buyers
export const optionalNtnOrCnicSchema = z.union([
  ntnOrCnicSchema,
  z.literal(''),
]);

// Date validation (YYYY-MM-DD)
export const invoiceDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'Date must be in format YYYY-MM-DD',
}).refine(
  (date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  },
  { message: 'Invalid date' }
);

// Tax rate validation (format: "18%")
export const taxRateSchema = z.string().regex(/^\d+%$/, {
  message: 'Tax rate must be in format "18%"',
});

// Invoice reference number (for Debit Notes)
export const invoiceRefSchema = z.string().regex(/^\d{22}$|^\d{28}$/, {
  message: 'Invoice reference must be 22 digits (NTN-based) or 28 digits (CNIC-based)',
});

// Province validation
export const provinceSchema = z.enum([
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Gilgit-Baltistan',
  'Azad Jammu and Kashmir',
], {
  errorMap: () => ({ message: 'Invalid province' }),
});
```

### Line Item Schema

```typescript
export const lineItemSchema = z.object({
  // Product identification
  hsCode: z.string()
    .min(1, 'HS Code is required')
    .max(20, 'HS Code cannot exceed 20 characters'),

  productDescription: z.string()
    .min(1, 'Product description is required')
    .max(500, 'Product description cannot exceed 500 characters'),

  // Quantity and measurement
  quantity: z.number()
    .positive('Quantity must be positive')
    .refine(
      (val) => {
        const decimalPlaces = (val.toString().split('.')[1] || '').length;
        return decimalPlaces <= 4;
      },
      { message: 'Quantity supports up to 4 decimal places' }
    ),

  uom: z.string()
    .min(1, 'Unit of measurement is required')
    .max(100, 'UOM cannot exceed 100 characters'),

  // Pricing
  valueSalesExcludingST: z.number()
    .nonnegative('Sales value cannot be negative')
    .refine(
      (val) => {
        const decimalPlaces = (val.toString().split('.')[1] || '').length;
        return decimalPlaces <= 2;
      },
      { message: 'Amount supports up to 2 decimal places' }
    ),

  fixedNotifiedValueOrRetailPrice: z.number()
    .nonnegative('Fixed value cannot be negative')
    .default(0),

  discount: z.number()
    .nonnegative('Discount cannot be negative')
    .optional()
    .default(0),

  // Tax fields
  rate: taxRateSchema,

  salesTaxApplicable: z.number()
    .nonnegative('Sales tax cannot be negative'),

  salesTaxWithheldAtSource: z.number()
    .nonnegative('Withheld tax cannot be negative')
    .default(0),

  extraTax: z.number()
    .nonnegative('Extra tax cannot be negative')
    .optional()
    .default(0),

  furtherTax: z.number()
    .nonnegative('Further tax cannot be negative')
    .optional()
    .default(0),

  // Classification
  saleType: z.string()
    .min(1, 'Sale type is required'),

  // Optional FBR fields
  sroScheduleNo: z.string()
    .max(50, 'SRO Schedule cannot exceed 50 characters')
    .optional(),

  fedPayable: z.number()
    .nonnegative('FED payable cannot be negative')
    .optional()
    .default(0),

  sroItemSerialNo: z.string()
    .max(50, 'SRO Item Serial cannot exceed 50 characters')
    .optional(),

  // Calculated field
  totalValues: z.number()
    .nonnegative('Total value cannot be negative'),
});

export type LineItem = z.infer<typeof lineItemSchema>;
```

### Invoice Schema

```typescript
export const invoiceSchema = z.object({
  // Invoice header
  invoiceType: z.enum(['Sale Invoice', 'Debit Note'], {
    errorMap: () => ({ message: 'Invoice type must be "Sale Invoice" or "Debit Note"' }),
  }),

  invoiceDate: invoiceDateSchema,

  // Seller information
  sellerNTNCNIC: ntnOrCnicSchema,
  sellerBusinessName: z.string()
    .min(1, 'Seller business name is required')
    .max(255, 'Seller name cannot exceed 255 characters'),
  sellerProvince: provinceSchema,
  sellerAddress: z.string()
    .min(1, 'Seller address is required')
    .max(1000, 'Seller address cannot exceed 1000 characters'),

  // Buyer information
  buyerNTNCNIC: optionalNtnOrCnicSchema,
  buyerBusinessName: z.string()
    .min(1, 'Buyer business name is required')
    .max(255, 'Buyer name cannot exceed 255 characters'),
  buyerProvince: provinceSchema,
  buyerAddress: z.string()
    .min(1, 'Buyer address is required')
    .max(1000, 'Buyer address cannot exceed 1000 characters'),
  buyerRegistrationType: z.enum(['Registered', 'Unregistered']),

  // Invoice reference (for Debit Notes)
  invoiceRefNo: z.string().optional(),

  // Line items
  items: z.array(lineItemSchema)
    .min(1, 'At least one line item is required')
    .max(100, 'Maximum 100 line items allowed'),
})
  // Cross-field validation: Debit Note requirements
  .refine(
    (data) => {
      if (data.invoiceType === 'Debit Note') {
        return !!data.invoiceRefNo && /^\d{22}$|^\d{28}$/.test(data.invoiceRefNo);
      }
      return true;
    },
    {
      message: 'Debit Note requires invoice reference (22 or 28 digits)',
      path: ['invoiceRefNo'],
    }
  )
  // Cross-field validation: Registered buyer requires NTN/CNIC
  .refine(
    (data) => {
      if (data.buyerRegistrationType === 'Registered') {
        return data.buyerNTNCNIC && data.buyerNTNCNIC.length > 0;
      }
      return true;
    },
    {
      message: 'Registered buyer requires NTN or CNIC',
      path: ['buyerNTNCNIC'],
    }
  )
  // Cross-field validation: NTN/CNIC format
  .refine(
    (data) => {
      if (data.buyerRegistrationType === 'Registered' && data.buyerNTNCNIC) {
        return /^\d{7}$|^\d{13}$/.test(data.buyerNTNCNIC);
      }
      return true;
    },
    {
      message: 'Buyer NTN/CNIC must be 7 or 13 digits for registered buyers',
      path: ['buyerNTNCNIC'],
    }
  );

export type InvoiceFormData = z.infer<typeof invoiceSchema>;
```

### Draft Schema

```typescript
export const draftSchema = z.object({
  id: z.string().uuid(),
  draftData: invoiceSchema.partial(), // All fields optional for drafts
  lastSaved: z.number(), // Unix timestamp
  organizationId: z.string().uuid(),
});

export type InvoiceDraft = z.infer<typeof draftSchema>;
```

---

## POST /api/invoices - Create Invoice

**Purpose**: Create and persist a new FBR-compliant invoice

### Request

**Endpoint**: `POST /api/invoices`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <session-token>
```

**Body**: (validated against `invoiceSchema`)
```typescript
{
  invoiceType: 'Sale Invoice' | 'Debit Note';
  invoiceDate: string; // YYYY-MM-DD
  sellerNTNCNIC: string; // 7 or 13 digits
  sellerBusinessName: string;
  sellerProvince: string;
  sellerAddress: string;
  buyerNTNCNIC: string; // 7 or 13 digits, or empty if unregistered
  buyerBusinessName: string;
  buyerProvince: string;
  buyerAddress: string;
  buyerRegistrationType: 'Registered' | 'Unregistered';
  invoiceRefNo?: string; // Required for Debit Notes
  items: LineItem[]; // 1-100 items
}
```

**Example**:
```json
{
  "invoiceType": "Sale Invoice",
  "invoiceDate": "2026-02-14",
  "sellerNTNCNIC": "0786909",
  "sellerBusinessName": "ABC Corporation",
  "sellerProvince": "Sindh",
  "sellerAddress": "123 Main Street, Karachi",
  "buyerNTNCNIC": "1000000000000",
  "buyerBusinessName": "XYZ Enterprises",
  "buyerProvince": "Punjab",
  "buyerAddress": "456 Commerce Road, Lahore",
  "buyerRegistrationType": "Registered",
  "items": [
    {
      "hsCode": "8517.6200",
      "productDescription": "Network Equipment",
      "quantity": 10.0,
      "uom": "Numbers, pieces, units",
      "valueSalesExcludingST": 50000.00,
      "fixedNotifiedValueOrRetailPrice": 0,
      "discount": 0,
      "rate": "18%",
      "salesTaxApplicable": 9000.00,
      "salesTaxWithheldAtSource": 0,
      "extraTax": 0,
      "furtherTax": 0,
      "saleType": "Goods at standard rate (default)",
      "totalValues": 59000.00
    }
  ]
}
```

### Response

**Success** (201 Created):
```typescript
{
  success: true;
  data: {
    invoice: {
      id: string; // UUID
      invoiceType: string;
      invoiceDate: string;
      status: 'draft' | 'submitted';
      subtotal: string; // Decimal as string
      totalTax: string;
      grandTotal: string;
      fbrPayload: object; // FBR-formatted JSON
      createdAt: string; // ISO 8601
    };
  };
  message: string;
}
```

**Example**:
```json
{
  "success": true,
  "data": {
    "invoice": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "invoiceType": "Sale Invoice",
      "invoiceDate": "2026-02-14",
      "status": "draft",
      "subtotal": "50000.00",
      "totalTax": "9000.00",
      "grandTotal": "59000.00",
      "fbrPayload": { /* FBR-formatted object */ },
      "createdAt": "2026-02-14T10:30:00Z"
    }
  },
  "message": "Invoice created successfully"
}
```

**Error** (400 Bad Request):
```typescript
{
  success: false;
  error: {
    code: string; // Error code (see Error Codes section)
    message: string;
    details?: object; // Zod validation errors
  };
}
```

**Example**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invoice validation failed",
    "details": {
      "items": [
        {
          "path": ["items", 0, "quantity"],
          "message": "Quantity must be positive"
        }
      ]
    }
  }
}
```

### Implementation

**File**: `src/app/api/invoices/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { invoices, lineItems } from '@/lib/db/schema/invoices';
import { invoiceSchema } from '@/lib/invoices/validation';
import { mapToFBRFormat } from '@/lib/invoices/fbr-mapping';
import { calculateInvoiceTotals } from '@/lib/invoices/calculations';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || !session.session.organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validationResult = invoiceSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invoice validation failed',
            details: validationResult.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const invoiceData = validationResult.data;

    // 3. Calculate totals
    const totals = calculateInvoiceTotals(invoiceData.items);

    // 4. Create invoice in database
    const [invoice] = await db.insert(invoices).values({
      organizationId: session.session.organizationId,
      invoiceType: invoiceData.invoiceType,
      invoiceDate: invoiceData.invoiceDate,
      sellerNTNCNIC: invoiceData.sellerNTNCNIC,
      sellerBusinessName: invoiceData.sellerBusinessName,
      sellerProvince: invoiceData.sellerProvince,
      sellerAddress: invoiceData.sellerAddress,
      buyerNTNCNIC: invoiceData.buyerNTNCNIC || null,
      buyerBusinessName: invoiceData.buyerBusinessName,
      buyerProvince: invoiceData.buyerProvince,
      buyerAddress: invoiceData.buyerAddress,
      buyerRegistrationType: invoiceData.buyerRegistrationType,
      invoiceRefNo: invoiceData.invoiceRefNo || null,
      subtotal: totals.subtotal.toFixed(2),
      totalTax: totals.totalTax.toFixed(2),
      grandTotal: totals.grandTotal.toFixed(2),
      status: 'draft',
      createdBy: session.user.id,
    }).returning();

    // 5. Create line items
    const lineItemsData = invoiceData.items.map((item, index) => ({
      invoiceId: invoice.id,
      lineNumber: index + 1,
      hsCode: item.hsCode,
      productDescription: item.productDescription,
      quantity: item.quantity.toString(),
      uom: item.uom,
      valueSalesExcludingST: item.valueSalesExcludingST.toString(),
      fixedNotifiedValueOrRetailPrice: (item.fixedNotifiedValueOrRetailPrice || 0).toString(),
      discount: (item.discount || 0).toString(),
      rate: item.rate,
      salesTaxApplicable: item.salesTaxApplicable.toString(),
      salesTaxWithheldAtSource: (item.salesTaxWithheldAtSource || 0).toString(),
      extraTax: (item.extraTax || 0).toString(),
      furtherTax: (item.furtherTax || 0).toString(),
      saleType: item.saleType,
      sroScheduleNo: item.sroScheduleNo || null,
      fedPayable: (item.fedPayable || 0).toString(),
      sroItemSerialNo: item.sroItemSerialNo || null,
      totalValues: item.totalValues.toString(),
    }));

    await db.insert(lineItems).values(lineItemsData);

    // 6. Generate FBR payload
    const fbrPayload = mapToFBRFormat(invoice, lineItemsData);

    // 7. Update invoice with FBR payload
    await db.update(invoices)
      .set({ fbrPayload })
      .where(eq(invoices.id, invoice.id));

    // 8. Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          invoice: {
            id: invoice.id,
            invoiceType: invoice.invoiceType,
            invoiceDate: invoice.invoiceDate,
            status: invoice.status,
            subtotal: invoice.subtotal,
            totalTax: invoice.totalTax,
            grandTotal: invoice.grandTotal,
            fbrPayload,
            createdAt: invoice.createdAt.toISOString(),
          },
        },
        message: 'Invoice created successfully',
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Invoice creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create invoice',
        },
      },
      { status: 500 }
    );
  }
}
```

---

## POST /api/invoices/validate - Validate Invoice

**Purpose**: Validate invoice data without persisting (pre-submission check)

### Request

**Endpoint**: `POST /api/invoices/validate`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <session-token>
```

**Body**: Same as `POST /api/invoices`

### Response

**Success** (200 OK):
```typescript
{
  success: true;
  data: {
    valid: boolean;
    calculations: {
      subtotal: number;
      totalTax: number;
      grandTotal: number;
      lineItemTotals: number[];
    };
    fbrPayload: object; // Preview of FBR-formatted JSON
  };
  message: string;
}
```

**Example**:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "calculations": {
      "subtotal": 50000.00,
      "totalTax": 9000.00,
      "grandTotal": 59000.00,
      "lineItemTotals": [59000.00]
    },
    "fbrPayload": { /* FBR-formatted object */ }
  },
  "message": "Invoice validation passed"
}
```

**Error** (400 Bad Request): Same as `POST /api/invoices`

### Implementation

**File**: `src/app/api/invoices/validate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { invoiceSchema } from '@/lib/invoices/validation';
import { mapToFBRFormat, validateFBRPayload } from '@/lib/invoices/fbr-mapping';
import { calculateInvoiceTotals } from '@/lib/invoices/calculations';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const validationResult = invoiceSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invoice validation failed',
            details: validationResult.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const invoiceData = validationResult.data;

    // 2. Calculate totals
    const calculations = calculateInvoiceTotals(invoiceData.items);

    // 3. Generate FBR payload (without saving)
    const fbrPayload = mapToFBRFormat(
      {
        invoiceType: invoiceData.invoiceType,
        invoiceDate: invoiceData.invoiceDate,
        sellerNTNCNIC: invoiceData.sellerNTNCNIC,
        sellerBusinessName: invoiceData.sellerBusinessName,
        sellerProvince: invoiceData.sellerProvince,
        sellerAddress: invoiceData.sellerAddress,
        buyerNTNCNIC: invoiceData.buyerNTNCNIC || '',
        buyerBusinessName: invoiceData.buyerBusinessName,
        buyerProvince: invoiceData.buyerProvince,
        buyerAddress: invoiceData.buyerAddress,
        buyerRegistrationType: invoiceData.buyerRegistrationType,
        invoiceRefNo: invoiceData.invoiceRefNo || null,
      } as any,
      invoiceData.items.map((item, index) => ({
        ...item,
        lineNumber: index + 1,
      })) as any
    );

    // 4. Validate FBR payload
    const fbrValidation = validateFBRPayload(fbrPayload);

    if (!fbrValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FBR_VALIDATION_ERROR',
            message: 'FBR validation failed',
            details: { errors: fbrValidation.errors },
          },
        },
        { status: 400 }
      );
    }

    // 5. Return validation result
    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        calculations,
        fbrPayload,
      },
      message: 'Invoice validation passed',
    });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to validate invoice',
        },
      },
      { status: 500 }
    );
  }
}
```

---

## GET /api/drafts - List Drafts

**Purpose**: Retrieve all saved drafts for the current organization (Phase 2 - server-side)

**Note**: Phase 1 uses IndexedDB client-side. This API is for Phase 2.

### Request

**Endpoint**: `GET /api/drafts`

**Headers**:
```
Authorization: Bearer <session-token>
```

**Query Parameters**:
- `limit` (optional): Number of drafts to return (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

### Response

**Success** (200 OK):
```typescript
{
  success: true;
  data: {
    drafts: Array<{
      id: string;
      draftData: Partial<InvoiceFormData>;
      lastSaved: string; // ISO 8601
      createdAt: string; // ISO 8601
    }>;
    total: number;
  };
}
```

---

## POST /api/drafts - Save Draft

**Purpose**: Save incomplete invoice as draft (Phase 2 - server-side)

### Request

**Endpoint**: `POST /api/drafts`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <session-token>
```

**Body**:
```typescript
{
  id?: string; // UUID (optional, auto-generated if not provided)
  draftData: Partial<InvoiceFormData>; // Partial invoice data
}
```

### Response

**Success** (201 Created or 200 OK if updating):
```typescript
{
  success: true;
  data: {
    draft: {
      id: string;
      lastSaved: string; // ISO 8601
    };
  };
  message: string;
}
```

---

## DELETE /api/drafts/:id - Delete Draft

**Purpose**: Delete a saved draft (Phase 2 - server-side)

### Request

**Endpoint**: `DELETE /api/drafts/:id`

**Headers**:
```
Authorization: Bearer <session-token>
```

**Path Parameters**:
- `id`: Draft UUID

### Response

**Success** (200 OK):
```typescript
{
  success: true;
  message: string;
}
```

**Error** (404 Not Found):
```typescript
{
  success: false;
  error: {
    code: 'DRAFT_NOT_FOUND';
    message: string;
  };
}
```

---

## Error Codes

### Client Errors (4xx)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | User not authenticated |
| `FORBIDDEN` | 403 | User lacks permission for this action |
| `VALIDATION_ERROR` | 400 | Request body failed Zod schema validation |
| `FBR_VALIDATION_ERROR` | 400 | Data failed FBR-specific validation rules |
| `INVOICE_NOT_FOUND` | 404 | Requested invoice does not exist |
| `DRAFT_NOT_FOUND` | 404 | Requested draft does not exist |
| `INVALID_REQUEST` | 400 | Malformed request (e.g., invalid JSON) |
| `ITEM_LIMIT_EXCEEDED` | 400 | More than 100 line items provided |

### Server Errors (5xx)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `FBR_API_ERROR` | 502 | FBR API request failed (Phase 2) |

### Error Response Format

```typescript
{
  success: false;
  error: {
    code: string; // Error code from table above
    message: string; // Human-readable error message
    details?: object; // Additional context (e.g., Zod validation errors)
  };
}
```

---

## Summary

This API contract provides:

✅ **Type Safety**: Zod schemas with TypeScript type inference
✅ **Comprehensive Validation**: Client and server-side validation with clear error messages
✅ **FBR Compliance**: Validation against FBR Digital Invoicing API v1.12 specification
✅ **Extensibility**: Draft management endpoints for Phase 2 migration
✅ **Developer Experience**: Clear request/response formats with examples

Next steps: See [../quickstart.md](../quickstart.md) for implementation guide.
