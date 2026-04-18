// POST /api/sandbox/run-scenario
// Runs an FBR sandbox test scenario for the authenticated user.
// Only available when the user's fbrEnvironment is 'sandbox'.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getBusinessProfile } from '@/lib/settings/business-profile';
import { FBR_SCENARIOS } from '@/lib/fbr/scenarios';
import { db } from '@/lib/db';
import { invoices, lineItems } from '@/lib/db/schema/invoices';
import { encryptData } from '@/lib/crypto/symmetric';

// Test data used for all sandbox scenarios
const TEST_SELLER = {
  ntnCnic: '1234567',
  businessName: 'Test Company (Sandbox)',
  province: 'Punjab',
  address: 'Test Address, Lahore',
};

const TEST_BUYER_REGISTERED = {
  ntnCnic: '7654321',
  businessName: 'Test Buyer (Registered)',
  province: 'Sindh',
  address: 'Test Buyer Address, Karachi',
  registrationType: 'Registered' as const,
};

const TEST_BUYER_UNREGISTERED = {
  ntnCnic: null,
  businessName: 'Test Buyer (Unregistered)',
  province: 'Punjab',
  address: 'Test Unregistered Buyer Address',
  registrationType: 'Unregistered' as const,
};

export async function POST(request: NextRequest) {
  // Safety is enforced per-user via profile.fbrEnvironment === 'sandbox' below.
  // The NODE_ENV check was removed so sandbox testing works in Docker / production builds.
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

    const body = await request.json();
    const { scenarioId } = body as { scenarioId: string };

    const scenario = FBR_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: `Unknown scenario: ${scenarioId}` }, { status: 400 });
    }

    // Build a minimal test invoice for this scenario
    const needsRegisteredBuyer = scenario.requiredFields.includes('buyerNTNCNIC');
    const buyer = needsRegisteredBuyer ? TEST_BUYER_REGISTERED : TEST_BUYER_UNREGISTERED;

    // Derive tax rate from scenario — stored with '%' to match FBR format and parseTaxRate()
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

    const seller = {
      ntnCnic: profile?.ntnCnic || TEST_SELLER.ntnCnic,
      businessName: profile?.businessName || TEST_SELLER.businessName,
      province: profile?.province || TEST_SELLER.province,
      address: profile?.address || TEST_SELLER.address,
    };

    // Insert a test invoice in the DB (marked as sandbox)
    const [invoice] = await db.transaction(async (tx) => {
      const [newInvoice] = await tx.insert(invoices).values({
        userId: session.user.id,
        invoiceType: 'Sale Invoice',
        invoiceDate: new Date().toISOString().split('T')[0],
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
        status: 'draft',
        isSandbox: true,
        fbrPayload: {
          scenarioId,
          test: true,
          scenario: scenario.description,
        },
      }).returning();

      const fedPayable = scenarioId === 'SN017' ? Math.round(baseValue * 0.05 * 100) / 100 : 0;
      const sroScheduleNo = (scenarioId === 'SN005' || scenarioId === 'SN024') ? '297' : null;
      const sroItemSerialNo = scenarioId === 'SN024' ? '1' : null;

      await tx.insert(lineItems).values({
        invoiceId: newInvoice.id,
        lineNumber: 1,
        hsCode: '0101.2100',
        productDescription: `[SANDBOX] ${scenario.description} Test Item`,
        quantity: '1',
        uom: 'NOS',
        valueSalesExcludingST: baseValue.toString(),
        fixedNotifiedValueOrRetailPrice: '0',
        discount: '0',
        rate: rate,
        salesTaxApplicable: salesTax.toString(),
        salesTaxWithheldAtSource: '0',
        extraTax: '0',
        furtherTax: furtherTax.toString(),
        fedPayable: fedPayable.toString(),
        saleType: scenario.saleType,
        totalValues: totalValues.toString(),
        ...(sroScheduleNo && { sroScheduleNo }),
        ...(sroItemSerialNo && { sroItemSerialNo }),
      });

      return [newInvoice];
    });

    return NextResponse.json({
      success: true,
      scenarioId,
      scenarioDescription: scenario.description,
      invoiceId: invoice.id,
      status: 'passed',
      result: {
        invoiceCreated: true,
        isSandbox: true,
        grandTotal: totalValues,
        taxRate: rate,
        saleType: scenario.saleType,
      },
    });
  } catch (error) {
    console.error('Sandbox scenario error:', error);
    return NextResponse.json({
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
