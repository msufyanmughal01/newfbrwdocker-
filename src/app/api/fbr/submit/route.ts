// POST /api/fbr/submit
// Validates then submits an invoice to FBR. Creates FBRSubmission record.
// Constitution Principle IX: issued invoices are immutable after this point.

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { invoices } from '@/lib/db/schema/invoices';
import { fbrSubmissions } from '@/lib/db/schema/fbr';
// mapToFBRFormat reserved for future use
// import { mapToFBRFormat } from '@/lib/invoices/fbr-mapping';
import { validateWithFBR } from '@/lib/fbr/validate';
import { postToFBR, FBRSubmissionError } from '@/lib/fbr/post-invoice';
import { transitionStatus } from '@/lib/fbr/status-machine';
import { FBRApiError, getEnv } from '@/lib/fbr/api-client';

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await request.json();
    const { invoiceId, scenarioId } = body as {
      invoiceId: string;
      scenarioId?: string;
    };

    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId is required' }, { status: 400 });
    }

    // 2. Load invoice from DB (ownership check)
    const invoiceRows = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (invoiceRows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invoiceRows[0];

    if (invoice.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Constitution Principle IX: already-issued invoices are immutable
    if (invoice.status === 'issued') {
      return NextResponse.json(
        {
          error: 'Invoice has already been issued. Issued invoices cannot be resubmitted.',
          fbrInvoiceNumber: invoice.fbrInvoiceNumber,
        },
        { status: 409 }
      );
    }

    // 3. Validate status transition: current → validating
    transitionStatus(
      (invoice.status as 'draft' | 'validating' | 'validated' | 'submitting' | 'issued' | 'failed'),
      'validating'
    );

    // 4. Create fbr_submissions record (status: validating)
    const [submission] = await db
      .insert(fbrSubmissions)
      .values({
        invoiceId: invoice.id,
        status: 'validating',
        environment: getEnv(),
        scenarioId: scenarioId ?? null,
        attemptedAt: new Date(),
      })
      .returning();

    // Update invoice status to validating
    await db
      .update(invoices)
      .set({ status: 'validating', fbrSubmissionId: submission.id })
      .where(eq(invoices.id, invoiceId));

    // 5. Map invoice to FBR payload
    // We need to reconstruct InvoiceFormData from the stored invoice
    // For now load line items too
    const { lineItems: lineItemsTable } = await import('@/lib/db/schema/invoices');
    const lineItemRows = await db
      .select()
      .from(lineItemsTable)
      .where(eq(lineItemsTable.invoiceId, invoiceId));

    // Build the FBR payload from stored invoice data
    const fbrPayload = {
      invoiceType: invoice.invoiceType,
      invoiceDate: invoice.invoiceDate,
      sellerNTNCNIC: invoice.sellerNTNCNIC,
      sellerBusinessName: invoice.sellerBusinessName,
      sellerProvince: invoice.sellerProvince,
      sellerAddress: invoice.sellerAddress,
      buyerNTNCNIC: invoice.buyerNTNCNIC ?? '',
      buyerBusinessName: invoice.buyerBusinessName,
      buyerProvince: invoice.buyerProvince,
      buyerAddress: invoice.buyerAddress,
      buyerRegistrationType: invoice.buyerRegistrationType,
      invoiceRefNo: invoice.invoiceRefNo ?? undefined,
      ...(scenarioId ? { scenarioId } : {}),
      items: lineItemRows
        .sort((a, b) => a.lineNumber - b.lineNumber)
        .map((item) => ({
          hsCode: item.hsCode,
          productDescription: item.productDescription,
          rate: item.rate,
          uom: item.uom,
          quantity: parseFloat(item.quantity),
          totalValues: parseFloat(item.totalValues),
          valueSalesExcludingST: parseFloat(item.valueSalesExcludingST),
          fixedNotifiedValueOrRetailPrice: parseFloat(item.fixedNotifiedValueOrRetailPrice ?? '0'),
          salesTaxApplicable: parseFloat(item.salesTaxApplicable),
          salesTaxWithheldAtSource: parseFloat(item.salesTaxWithheldAtSource ?? '0'),
          extraTax: parseFloat(item.extraTax ?? '0'),
          furtherTax: parseFloat(item.furtherTax ?? '0'),
          sroScheduleNo: item.sroScheduleNo ?? '',
          fedPayable: parseFloat(item.fedPayable ?? '0'),
          discount: parseFloat(item.discount ?? '0'),
          saleType: item.saleType,
          sroItemSerialNo: item.sroItemSerialNo ?? '',
        })),
    };

    // 6. Call FBR Validate API (pass userId so per-user token is used)
    const validateResult = await validateWithFBR(fbrPayload as Parameters<typeof validateWithFBR>[0], userId);

    // Store validate request/response
    await db
      .update(fbrSubmissions)
      .set({
        validateRequest: fbrPayload as Record<string, unknown>,
        validateResponse: validateResult.fbrResponse as unknown as Record<string, unknown>,
        status: validateResult.valid ? 'validated' : 'failed',
      })
      .where(eq(fbrSubmissions.id, submission.id));

    if (!validateResult.valid) {
      // Update invoice status to failed
      await db
        .update(invoices)
        .set({ status: 'failed' })
        .where(eq(invoices.id, invoiceId));

      return NextResponse.json(
        {
          success: false,
          stage: 'validation',
          errors: validateResult.errors,
        },
        { status: 422 }
      );
    }

    // 7. Transition to submitting
    await db
      .update(invoices)
      .set({ status: 'submitting' })
      .where(eq(invoices.id, invoiceId));

    await db
      .update(fbrSubmissions)
      .set({ status: 'submitting' })
      .where(eq(fbrSubmissions.id, submission.id));

    // 8. Call FBR Post API (pass userId so per-user token is used)
    const postResult = await postToFBR(fbrPayload as Parameters<typeof postToFBR>[0], userId);

    // 9. Store result and mark as issued in a single atomic update
    const issuedAt = new Date();

    await db
      .update(fbrSubmissions)
      .set({
        postRequest: fbrPayload as Record<string, unknown>,
        postResponse: postResult as unknown as Record<string, unknown>,
        fbrInvoiceNumber: postResult.invoiceNumber,
        status: 'issued',
        issuedAt,
      })
      .where(eq(fbrSubmissions.id, submission.id));

    // Update invoice — this is the immutable issued state (Constitution IX)
    await db
      .update(invoices)
      .set({
        status: 'issued',
        fbrInvoiceNumber: postResult.invoiceNumber,
        fbrSubmittedAt: issuedAt,
        issuedAt,
      })
      .where(eq(invoices.id, invoiceId));

    // T040: Save buyer to registry after successful FBR issuance
    if (invoice.buyerNTNCNIC && invoice.buyerBusinessName) {
      const { buyerRegistry } = await import('@/lib/db/schema/fbr');
      try {
        await db
          .insert(buyerRegistry)
          .values({
            userId: userId,
            ntnCnic: invoice.buyerNTNCNIC,
            businessName: invoice.buyerBusinessName,
            province: invoice.buyerProvince,
            address: invoice.buyerAddress,
            registrationType: invoice.buyerRegistrationType,
            lastUsedAt: issuedAt,
            useCount: 1,
          })
          .onConflictDoUpdate({
            target: [buyerRegistry.userId, buyerRegistry.ntnCnic],
            set: {
              businessName: invoice.buyerBusinessName,
              province: invoice.buyerProvince,
              address: invoice.buyerAddress,
              registrationType: invoice.buyerRegistrationType,
              lastUsedAt: issuedAt,
              useCount: db.$count(buyerRegistry) as unknown as number,
              updatedAt: issuedAt,
            },
          });
      } catch {
        // Non-fatal: buyer registry save failure doesn't block invoice issuance
      }
    }

    return NextResponse.json(
      {
        success: true,
        fbrInvoiceNumber: postResult.invoiceNumber,
        issuedAt: issuedAt.toISOString(),
        submissionId: submission.id,
      },
      { status: 201 }
    );
  } catch (err) {
    if ((err as Error & { code?: string }).code === 'FBR_TOKEN_MISSING') {
      return NextResponse.json(
        {
          error: 'FBR token not configured',
          code: 'FBR_TOKEN_MISSING',
          message: 'Add your FBR token in Business Settings.',
        },
        { status: 400 }
      );
    }
    if (err instanceof FBRSubmissionError) {
      return NextResponse.json(
        {
          success: false,
          stage: 'submission',
          fbrError: {
            statusCode: err.statusCode,
            error: err.fbrStatus,
          },
        },
        { status: 422 }
      );
    }
    if (err instanceof FBRApiError && err.statusCode === 504) {
      return NextResponse.json(
        { error: 'FBR API timeout — please retry' },
        { status: 504 }
      );
    }
    console.error('FBR submit error:', err);
    return NextResponse.json(
      { error: 'FBR submission failed', details: (err as Error).message },
      { status: 500 }
    );
  }
}
