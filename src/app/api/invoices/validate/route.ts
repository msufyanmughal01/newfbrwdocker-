// T018: Invoice validation endpoint
import { NextRequest, NextResponse } from 'next/server';
import { invoiceSchema } from '@/lib/invoices/validation';
import { ZodError } from 'zod';

/**
 * POST /api/invoices/validate
 * Validates invoice data against FBR requirements without saving
 *
 * Request body: Partial invoice data (InvoiceFormData)
 * Response: { valid: boolean, errors?: ZodError[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate against Zod schema
    const validated = invoiceSchema.parse(body);

    return NextResponse.json({
      valid: true,
      data: validated,
    }, { status: 200 });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({
        valid: false,
        errors: error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        })),
      }, { status: 400 });
    }

    console.error('Validation endpoint error:', error);
    return NextResponse.json({
      valid: false,
      errors: [{ message: 'Internal validation error' }],
    }, { status: 500 });
  }
}
