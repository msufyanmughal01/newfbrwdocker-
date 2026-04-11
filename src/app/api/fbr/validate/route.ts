// POST /api/fbr/validate
// Validates an invoice against FBR Validate API without submitting it.
// Server-side only — FBR_API_TOKEN never leaves the server.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { invoiceSchema } from '@/lib/invoices/validation';
import { mapToFBRFormat } from '@/lib/invoices/fbr-mapping';
import { validateWithFBR } from '@/lib/fbr/validate';
import { FBRApiError } from '@/lib/fbr/api-client';
import { db } from '@/lib/db';
import { businessProfiles } from '@/lib/db/schema/business-profiles';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await request.json();
    const { invoiceData, scenarioId } = body as {
      invoiceData: unknown;
      scenarioId?: string;
    };

    // 2. Validate invoice data with Zod schema
    const validated = invoiceSchema.parse(invoiceData);

    // 3. Map to FBR payload format
    const fbrPayload = mapToFBRFormat(validated);

    // Inject scenarioId for sandbox testing
    if (scenarioId) {
      (fbrPayload as unknown as Record<string, unknown>).scenarioId = scenarioId;
    }

    // 4. Resolve user's FBR environment setting
    const profileRows = await db
      .select({ fbrEnvironment: businessProfiles.fbrEnvironment })
      .from(businessProfiles)
      .where(eq(businessProfiles.userId, userId))
      .limit(1);
    const fbrEnvironment = profileRows[0]?.fbrEnvironment;

    // 5. Call FBR Validate API (pass userId for per-user token resolution)
    const result = await validateWithFBR(fbrPayload, userId, fbrEnvironment);

    if (result.valid) {
      return NextResponse.json({
        valid: true,
        fbrResponse: result.fbrResponse,
      });
    }

    return NextResponse.json({
      valid: false,
      errors: result.errors,
      fbrResponse: result.fbrResponse,
    });
  } catch (err) {
    if (err instanceof FBRApiError && err.statusCode === 504) {
      return NextResponse.json(
        { error: 'FBR API timeout — please retry' },
        { status: 504 }
      );
    }
    if (err instanceof Error && err.name === 'ZodError') {
      // Return a generic message — Zod's internal path/message may expose schema details
      return NextResponse.json(
        { error: 'Invoice data is invalid. Please check all fields and try again.' },
        { status: 422 }
      );
    }
    console.error('FBR validate error:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: 'FBR validation failed' },
      { status: 500 }
    );
  }
}
