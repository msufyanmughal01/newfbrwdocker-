// T019: Invoice creation endpoint with FBR mapping
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { invoices, lineItems } from '@/lib/db/schema/invoices';
import { invoiceSchema } from '@/lib/invoices/validation';
import { calculateInvoiceTotals } from '@/lib/invoices/calculations';
import { mapToFBRFormat, validateFBRPayload } from '@/lib/invoices/fbr-mapping';
import { ZodError } from 'zod';
import { withDecryption } from '@/lib/crypto/with-decryption';
import { encryptData, decryptData } from '@/lib/crypto/symmetric';

/**
 * POST /api/invoices
 * Creates a new FBR-compliant invoice with line items.
 * Accepts both plain and ECDH-encrypted bodies (X-Encrypted: 1).
 *
 * Request body: InvoiceFormData
 * Response: { success: boolean, invoiceId?: string, fbrPayload?: object }
 */
export const POST = withDecryption(async (request: NextRequest, body: unknown) => {
  try {
    // 1. Authenticate user
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      console.error('❌ No session found');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. body already parsed (and decrypted if X-Encrypted: 1) by withDecryption HOC

    const validated = invoiceSchema.parse(body as Record<string, unknown>);

    // 3. Calculate totals
    const calculations = calculateInvoiceTotals(validated.items);

    // 4. Map to FBR format and validate
    const fbrPayload = mapToFBRFormat(validated);
    const fbrValidation = validateFBRPayload(fbrPayload);

    if (!fbrValidation.valid) {
      return NextResponse.json({
        success: false,
        error: 'FBR validation failed',
        details: fbrValidation.errors,
      }, { status: 400 });
    }

    // 5. Save to database (transaction)
    const [invoice] = await db.transaction(async (tx) => {
      // Insert invoice
      const [newInvoice] = await tx.insert(invoices).values({
        userId,
        invoiceType: validated.invoiceType,
        invoiceDate: validated.invoiceDate,
        invoiceRefNo: validated.invoiceRefNo || null,
        sellerNTNCNIC: encryptData(validated.sellerNTNCNIC),
        sellerBusinessName: validated.sellerBusinessName,
        sellerProvince: validated.sellerProvince,
        sellerAddress: validated.sellerAddress,
        buyerNTNCNIC: validated.buyerNTNCNIC ? encryptData(validated.buyerNTNCNIC) : null,
        buyerBusinessName: validated.buyerBusinessName,
        buyerProvince: validated.buyerProvince,
        buyerAddress: validated.buyerAddress,
        buyerRegistrationType: validated.buyerRegistrationType,
        subtotal: calculations.subtotal.toString(),
        totalTax: calculations.totalTax.toString(),
        grandTotal: calculations.grandTotal.toString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fbrPayload: fbrPayload as any,
        status: 'draft',
      }).returning();

      // Insert line items
      if (validated.items.length > 0) {
        await tx.insert(lineItems).values(
          validated.items.map((item, index) => ({
            invoiceId: newInvoice.id,
            lineNumber: index + 1,
            hsCode: item.hsCode,
            productDescription: item.productDescription,
            quantity: item.quantity.toString(),
            uom: item.uom,
            valueSalesExcludingST: item.valueSalesExcludingST.toString(),
            fixedNotifiedValueOrRetailPrice: item.fixedNotifiedValueOrRetailPrice?.toString() || '0',
            discount: item.discount?.toString() || '0',
            rate: item.rate,
            salesTaxApplicable: calculations.lineItemTotals[index].salesTax.toString(),
            salesTaxWithheldAtSource: item.salesTaxWithheldAtSource?.toString() || '0',
            extraTax: item.extraTax?.toString() || '0',
            furtherTax: item.furtherTax?.toString() || '0',
            saleType: item.saleType,
            totalValues: calculations.lineItemTotals[index].lineTotal.toString(),
          }))
        );
      }

      return [newInvoice];
    });

    return NextResponse.json({
      success: true,
      invoiceId: invoice.id,
      fbrPayload,
      calculations,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof ZodError) {
      console.error('❌ Zod Validation Error:', error.issues);
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      }, { status: 400 });
    }

    console.error('❌ Invoice creation error:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to create invoice',
      details: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.name : typeof error,
    }, { status: 500 });
  }
});

/**
 * GET /api/invoices
 * List invoices for the active organization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get invoices for this user
    const invoiceList = await db.query.invoices.findMany({
      where: (invoices, { eq }) => eq(invoices.userId, userId),
      orderBy: (invoices, { desc }) => [desc(invoices.invoiceDate)],
      limit: 100,
    });

    const decrypted = invoiceList.map((inv) => ({
      ...inv,
      sellerNTNCNIC: decryptData(inv.sellerNTNCNIC),
      buyerNTNCNIC: inv.buyerNTNCNIC ? decryptData(inv.buyerNTNCNIC) : inv.buyerNTNCNIC,
    }));

    return NextResponse.json({
      invoices: decrypted,
    }, { status: 200 });

  } catch (error) {
    console.error('Invoice list error:', error);
    return NextResponse.json({
      error: 'Failed to fetch invoices',
    }, { status: 500 });
  }
}
