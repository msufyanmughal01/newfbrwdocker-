// POST /api/sandbox/check-connection
// Runs API_CONN and TOKEN_VALID pre-flight checks against FBR sandbox.
// Makes one authenticated POST to validateinvoicedata_sb and derives both check results.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getBusinessProfile } from '@/lib/settings/business-profile';
import { fbrPost, FBRApiError } from '@/lib/fbr/api-client';

const SANDBOX_ENDPOINT = 'https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata_sb';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getBusinessProfile(session.user.id);
    if (profile?.fbrEnvironment !== 'sandbox') {
      return NextResponse.json({ error: 'Sandbox mode not enabled' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];
    const testPayload = {
      invoiceType: 'Sale Invoice',
      invoiceDate: today,
      sellerNTNCNIC: profile.ntnCnic || '4210193397701',
      sellerBusinessName: profile.businessName || 'xyzlimited',
      sellerProvince: profile.province || 'SINDH',
      sellerAddress: profile.address || 'Test Address',
      buyerNTNCNIC: '2046004',
      buyerBusinessName: 'FERTILIZER MANUFAC IRS NEW',
      buyerProvince: 'Sindh',
      buyerAddress: 'Karachi',
      buyerRegistrationType: 'Registered',
      invoiceRefNo: `CONN-TEST-${Date.now()}`,
      scenarioId: 'SN001',
      items: [{
        hsCode: '0101.2100',
        productDescription: 'Connectivity Test',
        rate: '18%',
        uoM: 'Numbers, pieces, units',
        quantity: 1,
        totalValues: 1180,
        valueSalesExcludingST: 1000,
        fixedNotifiedValueOrRetailPrice: 0,
        salesTaxApplicable: 180,
        salesTaxWithheldAtSource: 0,
        extraTax: '',
        furtherTax: 0,
        sroScheduleNo: '',
        fedPayable: 0,
        discount: 0,
        saleType: 'Goods at standard rate (default)',
        sroItemSerialNo: '',
      }],
    };

    const t0 = Date.now();
    let apiConnPassed = false;
    let tokenValidPassed = false;
    let apiConnMessage = 'Could not connect to FBR sandbox API';
    let tokenMessage = 'Token validation not attempted';

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await fbrPost('validateinvoicedata', testPayload as any, session.user.id, 'sandbox');
      apiConnPassed = true;
      tokenValidPassed = true;
      apiConnMessage = 'Successfully connected to FBR sandbox API';
      tokenMessage = 'API token is valid and authorized';
    } catch (err) {
      const code = (err as Error & { code?: string }).code;

      if (code === 'FBR_TOKEN_MISSING') {
        apiConnMessage = 'No FBR token configured — cannot test connectivity';
        tokenMessage = 'No FBR token configured. Add your token in Settings → FBR Integration.';
      } else if (code === 'FBR_TOKEN_EXPIRED') {
        apiConnPassed = true;
        apiConnMessage = 'Successfully connected to FBR sandbox API';
        tokenMessage = 'FBR token has expired. Please update it in Settings → FBR Integration.';
      } else if (err instanceof FBRApiError) {
        if (err.statusCode === 401 || err.statusCode === 403) {
          apiConnPassed = true;
          apiConnMessage = 'Successfully connected to FBR sandbox API';
          tokenMessage = 'API token is invalid or lacks required permissions (401)';
        } else {
          // 4xx validation errors mean API is reachable and token is accepted
          apiConnPassed = true;
          tokenValidPassed = true;
          apiConnMessage = 'Successfully connected to FBR sandbox API';
          tokenMessage = 'API token is valid and authorized';
        }
      } else {
        apiConnMessage = `Network error: ${(err as Error).message}`;
        tokenMessage = 'Connection failed — cannot verify token';
      }
    }

    const durationMs = Date.now() - t0;

    return NextResponse.json({
      checks: [
        {
          id: 'API_CONN',
          description: 'Test basic connectivity to FBR sandbox API',
          status: apiConnPassed ? 'passed' : 'failed',
          message: apiConnMessage,
          endpoint: SANDBOX_ENDPOINT,
          durationMs,
        },
        {
          id: 'TOKEN_VALID',
          description: 'Verify sandbox API token is valid and has required permissions',
          status: tokenValidPassed ? 'passed' : 'failed',
          message: tokenMessage,
          endpoint: SANDBOX_ENDPOINT,
          durationMs,
        },
      ],
    });
  } catch (error) {
    console.error('Check connection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
