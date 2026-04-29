// POST /api/sandbox/check-connection
// Runs API_CONN and TOKEN_VALID pre-flight checks against FBR sandbox.
// Makes one authenticated POST to validateinvoicedata_sb and derives both check results.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { fbrPost, FBRApiError } from '@/lib/fbr/api-client';
import { FBRContextError, validateFBRContext } from '@/lib/fbr/context';

const SANDBOX_ENDPOINT = 'https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata_sb';

function buildApiCall(
  body: Record<string, unknown>,
  response: unknown,
  durationMs: number,
  statusCode?: number
) {
  return {
    method: 'POST',
    endpoint: SANDBOX_ENDPOINT,
    body,
    response,
    durationMs,
    statusCode,
  };
}

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Sandbox mode not enabled' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];
    const testPayload = {
      invoiceType: 'Sale Invoice',
      invoiceDate: today,
      sellerNTNCNIC: context.ntn,
      sellerBusinessName: context.profile.businessName ?? '',
      sellerProvince: context.profile.province ?? '',
      sellerAddress: context.profile.address ?? '',
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
    let apiResponse: unknown = null;
    let apiStatusCode: number | undefined;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      apiResponse = await fbrPost('validateinvoicedata', testPayload as any, session.user.id, 'sandbox');
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
        apiResponse = err.body;
        apiStatusCode = err.statusCode;
        if (err.statusCode === 401) {
          apiConnPassed = true;
          apiConnMessage = 'Successfully connected to FBR sandbox API';
          tokenMessage = 'FBR rejected request: token is not authorized for this NTN';
        } else if (err.statusCode === 403) {
          apiConnPassed = true;
          apiConnMessage = 'Successfully connected to FBR sandbox API';
          tokenMessage = 'API token is invalid or lacks required permissions (403)';
        } else {
          // 4xx validation errors mean API is reachable and token is accepted
          apiConnPassed = true;
          tokenValidPassed = true;
          apiConnMessage = 'Successfully connected to FBR sandbox API';
          tokenMessage = 'API token is valid and authorized';
        }
      } else {
        apiResponse = { error: (err as Error).message };
        apiConnMessage = `Network error: ${(err as Error).message}`;
        tokenMessage = 'Connection failed — cannot verify token';
      }
    }

    const durationMs = Date.now() - t0;
    const apiCall = buildApiCall(testPayload, apiResponse, durationMs, apiStatusCode);

    return NextResponse.json({
      checks: [
        {
          id: 'API_CONN',
          description: 'Test basic connectivity to FBR sandbox API',
          status: apiConnPassed ? 'passed' : 'failed',
          message: apiConnMessage,
          endpoint: SANDBOX_ENDPOINT,
          durationMs,
          apiCall,
        },
        {
          id: 'TOKEN_VALID',
          description: 'Verify sandbox API token is valid and has required permissions',
          status: tokenValidPassed ? 'passed' : 'failed',
          message: tokenMessage,
          endpoint: SANDBOX_ENDPOINT,
          durationMs,
          apiCall,
        },
      ],
    });
  } catch (error) {
    console.error('Check connection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
