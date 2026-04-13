// FBR submission orchestration — extracted from /api/fbr/submit route handler.
// Handles the full validate → post → persist flow with proper DB transactions.

import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoices, lineItems } from "@/lib/db/schema/invoices";
import { businessProfiles } from "@/lib/db/schema/business-profiles";
import { fbrSubmissions, buyerRegistry } from "@/lib/db/schema/fbr";
import { validateWithFBR } from "./validate";
import { postToFBR } from "./post-invoice";
import { transitionStatus } from "./status-machine";
import { getEnv } from "./api-client";
import { decryptData } from "@/lib/crypto/symmetric";

export type InvoiceStatus = "draft" | "validating" | "validated" | "submitting" | "issued" | "failed";

export interface SubmitResult {
  success: true;
  fbrInvoiceNumber: string;
  issuedAt: string;
  submissionId: string;
}

export interface SubmitFailure {
  success: false;
  stage: "validation" | "submission";
  errors?: unknown;
  fbrError?: { statusCode: number; error: string };
}

export type SubmitOutcome = SubmitResult | SubmitFailure;

export interface SubmitInvoiceInput {
  invoiceId: string;
  userId: string;
  scenarioId?: string;
}

/**
 * Orchestrates the full FBR submission flow for a single invoice.
 *
 * DB transaction boundaries:
 *   TX-1: Create submission record + update invoice to validating (atomic)
 *   [FBR validate call — external, cannot be in TX]
 *   TX-2: Update submission + invoice with validation result (atomic)
 *   [FBR post call — external, cannot be in TX]
 *   TX-3: Update submission + invoice with issued state + upsert buyer registry (atomic)
 *
 * Throws FBRApiError, FBRSubmissionError, or generic Error for unexpected failures.
 */
export async function submitInvoiceToFBR({
  invoiceId,
  userId,
  scenarioId,
}: SubmitInvoiceInput): Promise<SubmitOutcome> {
  // 0. Resolve user's FBR environment setting (fallback to env var via getEnv())
  const profileRows = await db
    .select({ fbrEnvironment: businessProfiles.fbrEnvironment })
    .from(businessProfiles)
    .where(eq(businessProfiles.userId, userId))
    .limit(1);
  const fbrEnvironment: string = profileRows[0]?.fbrEnvironment ?? getEnv();

  // 1. Load invoice (ownership check done by caller)
  const invoiceRows = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);

  if (invoiceRows.length === 0) {
    throw Object.assign(new Error("Invoice not found"), { code: "NOT_FOUND" });
  }

  const invoice = invoiceRows[0];

  if (invoice.userId !== userId) {
    throw Object.assign(new Error("Forbidden"), { code: "FORBIDDEN" });
  }

  if (invoice.status === "issued") {
    return {
      success: false,
      stage: "validation",
      errors: {
        alreadyIssued: true,
        fbrInvoiceNumber: invoice.fbrInvoiceNumber,
      },
    };
  }

  // Reset failed invoices to draft so status machine transition is valid
  let currentStatus = invoice.status as InvoiceStatus;
  if (currentStatus === "failed") {
    await db.update(invoices).set({ status: "draft" }).where(eq(invoices.id, invoiceId));
    currentStatus = "draft";
  }
  transitionStatus(currentStatus, "validating");

  // 2. Load line items
  const lineItemRows = await db
    .select()
    .from(lineItems)
    .where(eq(lineItems.invoiceId, invoiceId));

  // 3. Build FBR payload
  const fbrPayload = buildFBRPayload(invoice, lineItemRows, scenarioId);

  // TX-1: Create submission record + mark invoice as validating
  const submission = await db.transaction(async (tx) => {
    const [sub] = await tx
      .insert(fbrSubmissions)
      .values({
        invoiceId: invoice.id,
        status: "validating",
        environment: getEnv(fbrEnvironment),
        scenarioId: scenarioId ?? null,
        attemptedAt: new Date(),
      })
      .returning();

    await tx
      .update(invoices)
      .set({ status: "validating", fbrSubmissionId: sub.id })
      .where(eq(invoices.id, invoiceId));

    return sub;
  });

  // 4. FBR validate (external call — outside any transaction)
  const validateResult = await validateWithFBR(
    fbrPayload as Parameters<typeof validateWithFBR>[0],
    userId,
    fbrEnvironment
  );

  // TX-2: Persist validation result
  await db.transaction(async (tx) => {
    await tx
      .update(fbrSubmissions)
      .set({
        validateRequest: fbrPayload as Record<string, unknown>,
        validateResponse: validateResult.fbrResponse as unknown as Record<string, unknown>,
        status: validateResult.valid ? "validated" : "failed",
      })
      .where(eq(fbrSubmissions.id, submission.id));

    await tx
      .update(invoices)
      .set({ status: validateResult.valid ? "submitting" : "failed" })
      .where(eq(invoices.id, invoiceId));
  });

  if (!validateResult.valid) {
    return {
      success: false,
      stage: "validation",
      errors: validateResult.errors,
    };
  }

  // 5. FBR post (external call — outside any transaction)
  const postResult = await postToFBR(
    fbrPayload as Parameters<typeof postToFBR>[0],
    userId,
    fbrEnvironment
  );

  const issuedAt = new Date();

  // TX-3: Persist issued state + buyer registry (all or nothing)
  await db.transaction(async (tx) => {
    await tx
      .update(fbrSubmissions)
      .set({
        postRequest: fbrPayload as Record<string, unknown>,
        postResponse: postResult as unknown as Record<string, unknown>,
        fbrInvoiceNumber: postResult.invoiceNumber,
        status: "issued",
        issuedAt,
      })
      .where(eq(fbrSubmissions.id, submission.id));

    await tx
      .update(invoices)
      .set({
        status: "issued",
        fbrInvoiceNumber: postResult.invoiceNumber,
        fbrSubmittedAt: issuedAt,
        issuedAt,
      })
      .where(eq(invoices.id, invoiceId));

    // T040: Save buyer to registry after successful FBR issuance (non-fatal if fails)
    if (invoice.buyerNTNCNIC && invoice.buyerBusinessName) {
      try {
        await tx
          .insert(buyerRegistry)
          .values({
            userId,
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
              useCount: sql`${buyerRegistry.useCount} + 1`,
              updatedAt: issuedAt,
            },
          });
      } catch {
        // Non-fatal: buyer registry failure must not block invoice issuance
      }
    }
  });

  return {
    success: true,
    fbrInvoiceNumber: postResult.invoiceNumber,
    issuedAt: issuedAt.toISOString(),
    submissionId: submission.id,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type InvoiceRow = typeof invoices.$inferSelect;
type LineItemRow = typeof lineItems.$inferSelect;

function buildFBRPayload(
  invoice: InvoiceRow,
  lineItemRows: LineItemRow[],
  scenarioId?: string
) {
  return {
    invoiceType: invoice.invoiceType,
    invoiceDate: invoice.invoiceDate,
    sellerNTNCNIC: decryptData(invoice.sellerNTNCNIC),
    sellerBusinessName: invoice.sellerBusinessName,
    sellerProvince: invoice.sellerProvince,
    sellerAddress: invoice.sellerAddress,
    buyerNTNCNIC: invoice.buyerNTNCNIC ? decryptData(invoice.buyerNTNCNIC) : "",
    buyerBusinessName: invoice.buyerBusinessName,
    buyerProvince: invoice.buyerProvince,
    buyerAddress: invoice.buyerAddress,
    buyerRegistrationType: invoice.buyerRegistrationType,
    invoiceRefNo: invoice.invoiceRefNo ?? "",
    ...(scenarioId ? { scenarioId } : {}),
    items: lineItemRows
      .sort((a, b) => a.lineNumber - b.lineNumber)
      .map((item) => ({
        hsCode: item.hsCode,
        productDescription: item.productDescription,
        rate: item.rate,
        uoM: item.uom, // FBR API v1.12 field name is 'uoM'
        quantity: parseFloat(item.quantity),
        totalValues: parseFloat(item.totalValues),
        valueSalesExcludingST: parseFloat(item.valueSalesExcludingST),
        fixedNotifiedValueOrRetailPrice: parseFloat(item.fixedNotifiedValueOrRetailPrice ?? "0"),
        salesTaxApplicable: parseFloat(item.salesTaxApplicable),
        salesTaxWithheldAtSource: parseFloat(item.salesTaxWithheldAtSource ?? "0"),
        extraTax: parseFloat(item.extraTax ?? "0"),
        furtherTax: parseFloat(item.furtherTax ?? "0"),
        sroScheduleNo: item.sroScheduleNo ?? "",
        fedPayable: parseFloat(item.fedPayable ?? "0"),
        discount: parseFloat(item.discount ?? "0"),
        saleType: item.saleType,
        sroItemSerialNo: item.sroItemSerialNo ?? "",
      })),
  };
}
