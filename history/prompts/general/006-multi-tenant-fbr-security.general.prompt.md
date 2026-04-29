---
name: Multi-tenant FBR security lock
description: Enforce tenant-scoped FBR sandbox checks and remove fallback identity leaks.
type: general
stage: general
date: 2026-04-28
surface: agent
model: gpt-4o-mini
feature: none
branch: main
user: user
labels: ["fbr", "sandbox", "security", "context", "validation"]
command: apply_patch (check-connection, run-scenario, new helper)
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files_yaml:
  - src/app/api/sandbox/check-connection/route.ts
  - src/app/api/sandbox/run-scenario/route.ts
  - src/lib/fbr/context.ts
  - AGENTS.md
tests_yaml:
  - Not run (not requested)
prompt_text: |
# Context from my IDE setup:

## Active file: src/app/api/sandbox/check-connection/route.ts

## Active selection of the file:
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

## Open tabs:
- route.ts: src/app/api/sandbox/check-connection/route.ts
- route.ts: src/app/api/sandbox/run-scenario/route.ts
- payload.json: payload.json

## My request for Codex:
You are a senior backend engineer working on a Next.js API that integrates with Pakistan FBR Digital Invoicing (DI) API.

## Objective
Fix a critical multi-tenant data integrity and security issue in the FBR integration.

## Current Problem
The system uses fallback hardcoded values like:

  sellerNTNCNIC: profile.ntnCnic || '4210193397701'

This causes:
1. Incorrect seller NTN being sent to FBR
2. 401 Unauthorized errors due to token ↔ NTN mismatch
3. Severe multi-user data leakage risk (one user may use another user's NTN)
4. Violates proper tenant isolation

## Requirements

### 1. Remove ALL hardcoded fallbacks
- NEVER use default NTN/CNIC like '4210193397701'
- If profile.ntnCnic is missing → throw error immediately

### 2. Enforce strict tenant binding
- sellerNTNCNIC MUST come ONLY from authenticated user's database profile
- FBR token MUST also belong to the same user
- Ensure:
    token.owner_ntn === profile.ntnCnic

### 3. Add validation layer BEFORE API call
Implement a pre-flight validation:

IF:
  - profile.ntnCnic is missing
  - token is missing
  - token cannot be decrypted
THEN:
  → return structured error (400)
  → DO NOT call FBR API

### 4. Improve error handling
Replace generic 401 handling with:

IF FBR returns 401:
  → return:
     "FBR rejected request: token is not authorized for this NTN"

### 5. Fix both endpoints

#### File 1: check-connection
- Remove fallback NTN
- Fail early if NTN missing
- Ensure token is loaded from DB for that user

#### File 2: run-scenario
- Already partially correct
- Ensure NO fallback anywhere
- Validate profile.ntnCnic exists before proceeding

### 6. Add helper function

Create:

function validateFBRContext(userId)

This should:
- fetch business profile
- fetch FBR token
- verify both exist
- return structured object:
  {
    ntn,
    token,
    environment
  }

### 7. Logging (important)
Log safely (no token exposure):

console.log({
  userId,
  ntn: profile.ntnCnic,
  tokenPresent: !!token
})

### 8. Security constraint
- NEVER expose token in logs or API response
- NEVER allow fallback identity
- Each request must be strictly user-scoped

## Output
- Refactored code for both endpoints
- New validation helper
- Clean error responses
- No hardcoded values anywhere

Focus on correctness, multi-tenant safety, and production reliability.
response_text: |
Implemented `validateFBRContext`, updated both sandbox endpoints to rely on it, and removed all NTN/token fallbacks while tightening error handling and logging.
---
## Prompt
<copied above prompt_text>
## Response
Implemented validateFBRContext plus sandbox endpoint refactors so each request is tenant-scoped, validates context before touching FBR, and surfaces precise sandbox errors.
