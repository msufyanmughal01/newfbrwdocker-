// POST /api/sandbox/run-scenario
// Builds a scenario-specific FBR payload and POSTs it directly to
// postinvoicedata_sb. Seller info always comes from the user's business profile.
// Only available when fbrEnvironment === 'sandbox'.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getBusinessProfile } from '@/lib/settings/business-profile';
import { FBR_SCENARIOS } from '@/lib/fbr/scenarios';
import { db } from '@/lib/db';
import { invoices, lineItems } from '@/lib/db/schema/invoices';
import { fbrSubmissions } from '@/lib/db/schema/fbr';
import { encryptData } from '@/lib/crypto/symmetric';
import { postToFBR, FBRSubmissionError } from '@/lib/fbr/post-invoice';
import { FBRApiError } from '@/lib/fbr/api-client';
import { eq } from 'drizzle-orm';

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

// Buyer used for registered-buyer scenarios — must be a real registered NTN in FBR sandbox
const TEST_BUYER_REGISTERED = {
  ntnCnic: '4240124569979',
  businessName: 'FERTILIZER MANUFAC IRS NEW',
  province: 'Sindh',
  address: 'Karachi',
  registrationType: 'Registered' as const,
};

const TEST_BUYER_UNREGISTERED = {
  ntnCnic: null as null,
  businessName: 'Walk-in Customer',
  province: 'Sindh',
  address: 'Karachi',
  registrationType: 'Unregistered' as const,
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getBusinessProfile(session.user.id);
    if (profile?.fbrEnvironment !== 'sandbox') {
      return NextResponse.json(
        { error: 'Sandbox scenarios are only available in sandbox mode. Enable sandbox in Settings > FBR Integration.' },
        { status: 403 }
      );
    }

    if (!profile.ntnCnic) {
      return NextResponse.json(
        { error: 'Your NTN/CNIC is not set in Business Settings. Please add it before running sandbox scenarios.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { scenarioId } = body as { scenarioId: string };

    const scenario = FBR_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: `Unknown scenario: ${scenarioId}` }, { status: 400 });
    }

    const needsRegisteredBuyer = scenario.requiredFields.includes('buyerNTNCNIC');
    const buyer = needsRegisteredBuyer ? TEST_BUYER_REGISTERED : TEST_BUYER_UNREGISTERED;

    const taxRateMap: Record<string, string> = {
      '18%': '18%',
      '17%': '17%',
      '7%': '7%',
      '5%': '5%',
      '0%': '0%',
      '18% + 2% further tax': '18%',
    };
    const rate = taxRateMap[scenario.taxVariant] ?? '18%';
    const baseValue = 10000;
    const taxRate = parseFloat(rate) / 100;
    const salesTax = Math.round(baseValue * taxRate * 100) / 100;
    const furtherTax = scenario.taxVariant.includes('further tax') ? Math.round(baseValue * 0.02 * 100) / 100 : 0;
    const totalValues = baseValue + salesTax + furtherTax;
    const fedPayable = scenarioId === 'SN017' ? Math.round(baseValue * 0.05 * 100) / 100 : 0;
    const sroScheduleNo = (scenarioId === 'SN005' || scenarioId === 'SN024') ? '297' : '';
    const sroItemSerialNo = scenarioId === 'SN024' ? '1' : '';

    const seller = {
      ntnCnic: profile.ntnCnic,
      businessName: profile.businessName || 'Test Company (Sandbox)',
      province: profile.province || 'Sindh',
      address: profile.address || 'Test Address',
    };

    const invoiceDate = new Date().toISOString().split('T')[0];

    // Build FBR payload directly — POST to postinvoicedata_sb (one call, no separate validate step)
    const fbrPayload = {
      invoiceType: 'Sale Invoice',
      invoiceDate,
      sellerNTNCNIC: seller.ntnCnic,
      sellerBusinessName: seller.businessName,
      sellerProvince: seller.province,
      sellerAddress: seller.address,
      buyerNTNCNIC: buyer.ntnCnic ?? '',
      buyerBusinessName: buyer.businessName,
      buyerProvince: buyer.province,
      buyerAddress: buyer.address,
      buyerRegistrationType: buyer.registrationType,
      invoiceRefNo: '',
      scenarioId,
      items: [
        {
          hsCode: '0101.2100',
          productDescription: `[SANDBOX] ${scenario.description}`,
          rate,
          uoM: 'Numbers, pieces, units',
          quantity: 1,
          totalValues,
          valueSalesExcludingST: baseValue,
          fixedNotifiedValueOrRetailPrice: 0,
          salesTaxApplicable: salesTax,
          salesTaxWithheldAtSource: 0,
          extraTax: '',
          furtherTax,
          sroScheduleNo,
          fedPayable,
          discount: 0,
          saleType: scenario.saleType,
          sroItemSerialNo,
        },
      ],
    };

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
      subtotal: baseValue.toString(),
      totalTax: (salesTax + furtherTax).toString(),
      grandTotal: totalValues.toString(),
      status: 'submitting',
      isSandbox: true,
      fbrPayload: { scenarioId, test: true, scenario: scenario.description },
    }).returning();

    await db.insert(lineItems).values({
      invoiceId: invoice.id,
      lineNumber: 1,
      hsCode: '0101.2100',
      productDescription: `[SANDBOX] ${scenario.description}`,
      quantity: '1',
      uom: 'Numbers, pieces, units',
      valueSalesExcludingST: baseValue.toString(),
      fixedNotifiedValueOrRetailPrice: '0',
      discount: '0',
      rate,
      salesTaxApplicable: salesTax.toString(),
      salesTaxWithheldAtSource: '0',
      extraTax: '',
      furtherTax: furtherTax.toString(),
      fedPayable: fedPayable.toString(),
      saleType: scenario.saleType,
      totalValues: totalValues.toString(),
      ...(sroScheduleNo ? { sroScheduleNo } : {}),
      ...(sroItemSerialNo ? { sroItemSerialNo } : {}),
    });

    // POST directly to FBR postinvoicedata_sb
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fbrResult = await postToFBR(fbrPayload as any, session.user.id, profile.fbrEnvironment);

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
      result: {
        isSandbox: true,
        grandTotal: totalValues,
        taxRate: rate,
        saleType: scenario.saleType,
        fbrInvoiceNumber: fbrResult.invoiceNumber,
        issuedAt: issuedAt.toISOString(),
      },
    });

  } catch (error) {
    const code = (error as Error & { code?: string }).code;
    if (code === 'FBR_TOKEN_DECRYPT_FAILED') {
      return NextResponse.json({
        success: false, status: 'failed',
        error: 'Your saved FBR token could not be read. Please re-save it in Settings → FBR Integration.',
        code,
      }, { status: 400 });
    }
    if (code === 'FBR_TOKEN_MISSING') {
      return NextResponse.json({
        success: false, status: 'failed',
        error: 'No FBR token configured. Add your token in Settings → FBR Integration.',
        code,
      }, { status: 400 });
    }
    if (code === 'FBR_TOKEN_EXPIRED') {
      return NextResponse.json({
        success: false, status: 'failed',
        error: 'Your FBR token has expired. Please update it in Settings → FBR Integration.',
        code,
      }, { status: 400 });
    }
    if (error instanceof FBRSubmissionError) {
      return NextResponse.json({
        success: false, status: 'failed',
        error: `FBR rejected the invoice: ${error.fbrStatus}`,
        fbrStatusCode: error.statusCode,
      }, { status: 422 });
    }
    if (error instanceof FBRApiError) {
      const fbrMessage = extractFBRMessage(error.body);
      console.error('Sandbox scenario FBR error:', error.statusCode, error.body);
      return NextResponse.json({
        success: false, status: 'failed',
        error: fbrMessage ? `FBR: ${fbrMessage}` : `FBR API error ${error.statusCode}`,
        fbrStatusCode: error.statusCode,
        fbrBody: error.body,
      }, { status: error.statusCode === 401 ? 400 : 502 });
    }
    console.error('Sandbox scenario error:', error);
    return NextResponse.json({
      success: false, status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
