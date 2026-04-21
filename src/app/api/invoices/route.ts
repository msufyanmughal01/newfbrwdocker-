// T019: Invoice creation endpoint with FBR mapping
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { invoices, lineItems } from '@/lib/db/schema/invoices';
import { invoiceSchema } from '@/lib/invoices/validation';
import { calculateInvoiceTotals } from '@/lib/invoices/calculations';
import { mapToFBRFormat, validateFBRPayload } from '@/lib/invoices/fbr-mapping';
import { getQuotaStatus } from '@/lib/subscriptions/quota';
import { ZodError } from 'zod';
import { withDecryption } from '@/lib/crypto/with-decryption';
import { encryptData, decryptData } from '@/lib/crypto/symmetric';
import { eq, and, gte, sql } from 'drizzle-orm';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent, getRequestIp } from '@/lib/security/audit';

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

    // 2a. Redis-backed rate limit (authoritative across replicas — supplements
    //     the edge middleware's in-process check).
    const ip = getRequestIp(request) ?? 'unknown';
    const rl = await checkRateLimit('invoice', `${userId}:${ip}`, { window: 60_000, max: 20 });
    if (rl.limited) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    // 2. Subscription quota check (uses billing cycle start if set)
    const quota = await getQuotaStatus(userId);

    if (quota.limitReached) {
      return NextResponse.json({
        success: false,
        error: `Monthly invoice limit reached. Your ${quota.planName} plan allows ${quota.invoicesPerMonth} invoices per month. You have used ${quota.invoicesUsed}. Please contact admin to upgrade your plan.`,
        limitReached: true,
        currentCount: quota.invoicesUsed,
        limit: quota.invoicesPerMonth,
        planName: quota.planName,
      }, { status: 429 });
    }

    // 3. body already parsed (and decrypted if X-Encrypted: 1) by withDecryption HOC
    const validated = invoiceSchema.parse(body as Record<string, unknown>);

    // 4. Calculate totals
    const calculations = calculateInvoiceTotals(validated.items);

    // 5. Map to FBR format and validate
    const fbrPayload = mapToFBRFormat(validated);
    const fbrValidation = validateFBRPayload(fbrPayload);

    if (!fbrValidation.valid) {
      return NextResponse.json({
        success: false,
        error: 'FBR validation failed',
        details: fbrValidation.errors,
      }, { status: 400 });
    }

    // 6. Save to database (transaction)
    // Quota is re-checked INSIDE the transaction to close the race window
    // between concurrent requests that both passed the initial soft-check above.
    const [invoice] = await db.transaction(async (tx) => {
      if (quota.invoicesPerMonth !== null) {
        const [{ count }] = await tx
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(invoices)
          .where(and(
            eq(invoices.userId, userId),
            eq(invoices.isSandbox, false),
            gte(invoices.createdAt, quota.cycleStart),
          ));

        if (count >= quota.invoicesPerMonth) {
          throw Object.assign(
            new Error('QUOTA_EXCEEDED'),
            { code: 'QUOTA_EXCEEDED', used: count, limit: quota.invoicesPerMonth }
          );
        }
      }

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
        isSandbox: quota.fbrEnvironment === 'sandbox',
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

    logAuditEvent({
      action:    'invoice_created',
      userId,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
      metadata:  { invoiceId: invoice.id, isSandbox: invoice.isSandbox },
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

    // Quota exceeded inside transaction (race condition guard)
    if (error instanceof Error && (error as NodeJS.ErrnoException & { code?: string }).code === 'QUOTA_EXCEEDED') {
      const quotaErr = error as Error & { used?: number; limit?: number | null };
      return NextResponse.json({
        success: false,
        error: 'Monthly invoice limit reached. Please contact admin to upgrade your plan.',
        limitReached: true,
        limit: quotaErr.limit ?? null,
      }, { status: 429 });
    }

    // Log full error server-side for debugging, but NEVER expose stack traces,
    // error types, or internal messages to the client in production.
    console.error('❌ Invoice creation error:', error instanceof Error ? error.message : error);

    return NextResponse.json({
      success: false,
      error: 'Failed to create invoice',
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

    const PAGE_SIZE = 50;
    const pageParam = parseInt(request.nextUrl.searchParams.get('page') ?? '1', 10);
    const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    const offset = (page - 1) * PAGE_SIZE;

    // Get invoices for this user with pagination
    const invoiceList = await db.query.invoices.findMany({
      where: (invoices, { eq }) => eq(invoices.userId, userId),
      orderBy: (invoices, { desc }) => [desc(invoices.invoiceDate)],
      limit: PAGE_SIZE,
      offset,
    });

    const decrypted = invoiceList.map((inv) => ({
      ...inv,
      sellerNTNCNIC: decryptData(inv.sellerNTNCNIC),
      buyerNTNCNIC: inv.buyerNTNCNIC ? decryptData(inv.buyerNTNCNIC) : inv.buyerNTNCNIC,
    }));

    return NextResponse.json({
      invoices: decrypted,
      pagination: { page, pageSize: PAGE_SIZE, hasMore: invoiceList.length === PAGE_SIZE },
    }, { status: 200 });

  } catch (error) {
    console.error('Invoice list error:', error);
    return NextResponse.json({
      error: 'Failed to fetch invoices',
    }, { status: 500 });
  }
}
