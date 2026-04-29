// POST /api/sandbox/run-scenario
// Builds a scenario-specific FBR payload from testData and POSTs it directly to
// postinvoicedata_sb. Seller info always comes from the user's business profile.
// Only available when fbrEnvironment === 'sandbox'.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { FBR_SCENARIOS } from '@/lib/fbr/scenarios';
import { db } from '@/lib/db';
import { invoices, lineItems } from '@/lib/db/schema/invoices';
import { fbrSubmissions } from '@/lib/db/schema/fbr';
import { encryptData } from '@/lib/crypto/symmetric';
import { postToFBR, FBRSubmissionError } from '@/lib/fbr/post-invoice';
import { FBRApiError } from '@/lib/fbr/api-client';
import { eq } from 'drizzle-orm';
import { FBRContextError, validateFBRContext } from '@/lib/fbr/context';

const SANDBOX_POST_ENDPOINT = 'https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb';

interface ApiCallDetails {
  method: 'POST';
  endpoint: string;
  body?: unknown;
  response?: unknown;
  durationMs: number;
  statusCode?: number | string;
}

function buildApiCall(
  body: unknown,
  response: unknown,
  durationMs: number,
  statusCode?: number | string
): ApiCallDetails {
  return {
    method: 'POST',
    endpoint: SANDBOX_POST_ENDPOINT,
    body,
    response,
    durationMs,
    statusCode,
  };
}

function extractFBRMessage(body: unknown): string | null {
  if (!body) return null;
  if (typeof body === 'string') return body;
  if (typeof body === 'object') {
    const b = body as Record<string, unknown>;
    const vr = b.validationResponse as Record<string, unknown> | undefined;
    if (vr?.error) return String(vr.error);
    if (b.error) return String(b.error);
    if (b.message) return String(b.message);
  }
  return null;
}

export async function POST(request: NextRequest) {
  const t0 = Date.now();
  let apiCall: ApiCallDetails | undefined;
  let fbrRequestBody: unknown;

  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let context;
    try {
      context = await validateFBRContext(session.user.id);
    } catch (error) {
      if (error instanceof FBRContextError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      throw error;
    }

    if (context.environment !== 'sandbox') {
      return NextResponse.json(
        { error: 'Sandbox scenarios are only available in sandbox mode. Enable sandbox in Settings > FBR Integration.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { scenarioId } = body as { scenarioId: string };

    const scenario = FBR_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: `Unknown scenario: ${scenarioId}` }, { status: 400 });
    }

    const { buyer, item } = scenario.testData;

    const seller = {
      ntnCnic: context.ntn,
      businessName: context.profile.businessName ?? '',
      province: context.profile.province ?? '',
      address: context.profile.address ?? '',
    };

    const invoiceDate = new Date().toISOString().split('T')[0];

    // Build FBR payload using scenario testData — seller always from profile
    const fbrPayload = {
      invoiceType: 'Sale Invoice',
      invoiceDate,
      sellerNTNCNIC: seller.ntnCnic,
      sellerBusinessName: seller.businessName,
      sellerProvince: seller.province,
      sellerAddress: seller.address,
      buyerNTNCNIC: buyer.ntnCnic,
      buyerBusinessName: buyer.businessName,
      buyerProvince: buyer.province,
      buyerAddress: buyer.address,
      buyerRegistrationType: buyer.registrationType,
      invoiceRefNo: scenario.testData.invoiceRefNo || `TEST-${scenarioId}-${Date.now()}`,
      scenarioId,
      items: [
        {
          hsCode: item.hsCode,
          productDescription: `[SANDBOX] ${item.productDescription}`,
          rate: item.rate,
          uoM: item.uom,
          quantity: item.quantity > 0 ? item.quantity : 1,
          totalValues: item.totalValues,
          valueSalesExcludingST: item.valueSalesExcludingST,
          fixedNotifiedValueOrRetailPrice: item.fixedNotifiedValueOrRetailPrice,
          salesTaxApplicable: item.salesTaxApplicable,
          salesTaxWithheldAtSource: item.salesTaxWithheldAtSource,
          extraTax: item.extraTax || '',
          furtherTax: item.furtherTax,
          sroScheduleNo: item.sroScheduleNo,
          fedPayable: item.fedPayable,
          discount: item.discount,
          saleType: item.saleType,
          sroItemSerialNo: item.sroItemSerialNo,
        },
      ],
    };
    fbrRequestBody = fbrPayload;

    // Save invoice to DB for record-keeping
    const [invoice] = await db.insert(invoices).values({
      userId: session.user.id,
      invoiceType: 'Sale Invoice',
      invoiceDate,
      sellerNTNCNIC: encryptData(seller.ntnCnic),
      sellerBusinessName: seller.businessName,
      sellerProvince: seller.province,
      sellerAddress: seller.address,
      buyerNTNCNIC: buyer.ntnCnic ? encryptData(buyer.ntnCnic) : null,
      buyerBusinessName: buyer.businessName,
      buyerProvince: buyer.province,
      buyerAddress: buyer.address,
      buyerRegistrationType: buyer.registrationType,
      subtotal: item.valueSalesExcludingST.toString(),
      totalTax: (item.salesTaxApplicable + item.furtherTax).toString(),
      grandTotal: item.totalValues > 0 ? item.totalValues.toString() : (item.valueSalesExcludingST + item.salesTaxApplicable + item.furtherTax).toString(),
      status: 'submitting',
      isSandbox: true,
      fbrPayload: { scenarioId, test: true, scenario: scenario.description },
    }).returning();

    await db.insert(lineItems).values({
      invoiceId: invoice.id,
      lineNumber: 1,
      hsCode: item.hsCode,
      productDescription: `[SANDBOX] ${item.productDescription}`,
      quantity: (item.quantity > 0 ? item.quantity : 1).toString(),
      uom: item.uom,
      valueSalesExcludingST: item.valueSalesExcludingST.toString(),
      fixedNotifiedValueOrRetailPrice: item.fixedNotifiedValueOrRetailPrice.toString(),
      discount: item.discount.toString(),
      rate: item.rate,
      salesTaxApplicable: item.salesTaxApplicable.toString(),
      salesTaxWithheldAtSource: item.salesTaxWithheldAtSource.toString(),
      extraTax: item.extraTax.toString(),
      furtherTax: item.furtherTax.toString(),
      fedPayable: item.fedPayable.toString(),
      saleType: item.saleType,
      totalValues: item.totalValues > 0 ? item.totalValues.toString() : (item.valueSalesExcludingST + item.salesTaxApplicable + item.furtherTax).toString(),
      ...(item.sroScheduleNo ? { sroScheduleNo: item.sroScheduleNo } : {}),
      ...(item.sroItemSerialNo ? { sroItemSerialNo: item.sroItemSerialNo } : {}),
    });

    // POST directly to FBR postinvoicedata_sb
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fbrResult = await postToFBR(fbrPayload as any, session.user.id, context.environment);
    const durationMs = Date.now() - t0;
    apiCall = buildApiCall(fbrPayload, fbrResult, durationMs);

    const issuedAt = new Date();

    // Persist submission record and mark invoice as issued
    await db.insert(fbrSubmissions).values({
      invoiceId: invoice.id,
      status: 'issued',
      environment: 'sandbox',
      scenarioId,
      attemptedAt: issuedAt,
      issuedAt,
      postRequest: fbrPayload as Record<string, unknown>,
      postResponse: fbrResult as unknown as Record<string, unknown>,
      fbrInvoiceNumber: fbrResult.invoiceNumber,
    });

    await db.update(invoices).set({
      status: 'issued',
      fbrInvoiceNumber: fbrResult.invoiceNumber,
      fbrSubmittedAt: issuedAt,
      issuedAt,
    }).where(eq(invoices.id, invoice.id));

    return NextResponse.json({
      success: true,
      scenarioId,
      scenarioDescription: scenario.description,
      invoiceId: invoice.id,
      status: 'passed',
      message: 'FBR sandbox scenario completed successfully',
      durationMs,
      apiCall,
      result: {
        isSandbox: true,
        grandTotal: item.totalValues,
        taxRate: item.rate,
        saleType: item.saleType,
        fbrInvoiceNumber: fbrResult.invoiceNumber,
        issuedAt: issuedAt.toISOString(),
      },
    });

  } catch (error) {
    const code = (error as Error & { code?: string }).code;
    const durationMs = Date.now() - t0;
    if (code === 'FBR_TOKEN_DECRYPT_FAILED') {
      return NextResponse.json({
        success: false, status: 'failed',
        error: 'Your saved FBR token could not be read. Please re-save it in Settings → FBR Integration.',
        code,
        durationMs,
      }, { status: 400 });
    }
    if (code === 'FBR_TOKEN_MISSING') {
      return NextResponse.json({
        success: false, status: 'failed',
        error: 'No FBR token configured. Add your token in Settings → FBR Integration.',
        code,
        durationMs,
      }, { status: 400 });
    }
    if (code === 'FBR_TOKEN_EXPIRED') {
      return NextResponse.json({
        success: false, status: 'failed',
        error: 'Your FBR token has expired. Please update it in Settings → FBR Integration.',
        code,
        durationMs,
      }, { status: 400 });
    }
    if (error instanceof FBRSubmissionError) {
      apiCall = buildApiCall(fbrRequestBody, {
        statusCode: error.statusCode,
        status: error.fbrStatus,
        message: error.message,
      }, durationMs, error.statusCode);
      return NextResponse.json({
        success: false, status: 'failed',
        error: `FBR rejected the invoice: ${error.fbrStatus}`,
        fbrStatusCode: error.statusCode,
        durationMs,
        apiCall,
      }, { status: 422 });
    }
    if (error instanceof FBRApiError) {
      const fbrMessage = extractFBRMessage(error.body);
      apiCall = buildApiCall(fbrRequestBody, error.body, durationMs, error.statusCode);
      console.error('Sandbox scenario FBR error:', error.statusCode, error.body);
      return NextResponse.json({
        success: false, status: 'failed',
        error: fbrMessage ? `FBR: ${fbrMessage}` : `FBR API error ${error.statusCode}`,
        fbrStatusCode: error.statusCode,
        fbrBody: error.body,
        durationMs,
        apiCall,
      }, { status: error.statusCode === 401 ? 400 : 502 });
    }
    console.error('Sandbox scenario error:', error);
    return NextResponse.json({
      success: false, status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      durationMs,
      apiCall,
    }, { status: 500 });
  }
}
