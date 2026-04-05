// POST /api/fbr/submit
// Validates then submits an invoice to FBR. Creates FBRSubmission record.
// Constitution Principle IX: issued invoices are immutable after this point.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { submitInvoiceToFBR } from "@/lib/fbr/submission-service";
import { FBRApiError } from "@/lib/fbr/api-client";
import { FBRSubmissionError } from "@/lib/fbr/post-invoice";
import { withDecryption } from "@/lib/crypto/with-decryption";

export const POST = withDecryption(async (request: NextRequest, body: unknown) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { invoiceId, scenarioId } = body as {
    invoiceId: string;
    scenarioId?: string;
  };

  if (!invoiceId) {
    return NextResponse.json({ error: "invoiceId is required" }, { status: 400 });
  }

  try {
    const result = await submitInvoiceToFBR({
      invoiceId,
      userId: session.user.id,
      scenarioId,
    });

    if (!result.success) {
      // Already-issued guard
      if (
        result.stage === "validation" &&
        typeof result.errors === "object" &&
        result.errors !== null &&
        "alreadyIssued" in result.errors
      ) {
        const err = result.errors as { alreadyIssued: boolean; fbrInvoiceNumber?: string };
        return NextResponse.json(
          {
            error: "Invoice has already been issued. Issued invoices cannot be resubmitted.",
            fbrInvoiceNumber: err.fbrInvoiceNumber,
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { success: false, stage: result.stage, ...(result.errors ? { errors: result.errors } : {}), ...(result.fbrError ? { fbrError: result.fbrError } : {}) },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        fbrInvoiceNumber: result.fbrInvoiceNumber,
        issuedAt: result.issuedAt,
        submissionId: result.submissionId,
      },
      { status: 201 }
    );
  } catch (err) {
    const code = (err as Error & { code?: string }).code;

    if (code === "NOT_FOUND") {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    if (code === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (code === "FBR_TOKEN_MISSING") {
      return NextResponse.json(
        {
          error: "FBR token not configured",
          code: "FBR_TOKEN_MISSING",
          message: "Add your FBR token in Business Settings.",
        },
        { status: 400 }
      );
    }
    if (code === "FBR_TOKEN_EXPIRED") {
      return NextResponse.json(
        {
          error: "FBR token has expired",
          code: "FBR_TOKEN_EXPIRED",
          message: "Your FBR API token has expired. Please update it in Business Settings.",
        },
        { status: 400 }
      );
    }
    if (err instanceof FBRSubmissionError) {
      return NextResponse.json(
        {
          success: false,
          stage: "submission",
          fbrError: { statusCode: err.statusCode, error: err.fbrStatus },
        },
        { status: 422 }
      );
    }
    if (err instanceof FBRApiError && err.statusCode === 504) {
      return NextResponse.json({ error: "FBR API timeout — please retry" }, { status: 504 });
    }

    console.error("FBR submit error:", err);
    return NextResponse.json(
      { error: "FBR submission failed", details: (err as Error).message },
      { status: 500 }
    );
  }
});
