import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bulkInvoiceBatches } from "@/lib/db/schema/bulk-invoices";
import { eq } from "drizzle-orm";
import { getBusinessProfile } from "@/lib/settings/business-profile";

interface BulkRow {
  rowIndex: number;
  buyerBusinessName?: string;
  buyerNTNCNIC?: string;
  buyerProvince?: string;
  buyerAddress?: string;
  buyerRegistrationType?: string;
  invoiceDate?: string;
  invoiceType?: string;
  hsCode?: string;
  productDescription?: string;
  quantity?: number;
  uom?: string;
  valueSalesExcludingST?: number;
  salesTaxApplicable?: number;
  discount?: number;
  rate?: string;
  errors: string[];
  valid: boolean;
  ntnVerified?: boolean;
  invoiceId?: string;
  fbrInvoiceNumber?: string;
  submitError?: string;
  submitted?: boolean;
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { batchId: string };
  const { batchId } = body;

  if (!batchId) {
    return NextResponse.json({ error: "batchId is required" }, { status: 400 });
  }

  // Load batch
  const batchRows = await db
    .select()
    .from(bulkInvoiceBatches)
    .where(eq(bulkInvoiceBatches.id, batchId))
    .limit(1);

  if (batchRows.length === 0) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  const batch = batchRows[0];

  if (batch.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = (batch.rows as unknown as BulkRow[]).filter((r) => r.valid && r.ntnVerified === true);

  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid rows to submit" }, { status: 400 });
  }

  // Load seller info from user's business profile
  const profile = await getBusinessProfile(session.user.id);
  const sellerNTNCNIC = profile?.ntnCnic ?? "";
  const sellerBusinessName = profile?.businessName ?? "";
  const sellerProvince = profile?.province ?? "Punjab";
  const sellerAddress = profile?.address ?? "";

  // Update batch status to submitting
  await db
    .update(bulkInvoiceBatches)
    .set({ status: "submitting", updatedAt: new Date() })
    .where(eq(bulkInvoiceBatches.id, batchId));

  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const cookieHeader = req.headers.get("cookie") ?? "";

  let submittedCount = 0;
  let failedCount = 0;
  const updatedRows = (batch.rows as unknown as BulkRow[]).map((r) => ({ ...r }));

  for (const row of rows) {
    const rowIndex = row.rowIndex;

    try {
      // Step 1: Save invoice via API
      const invoicePayload = {
        invoiceType: row.invoiceType ?? "Sale Invoice",
        invoiceDate: row.invoiceDate ?? new Date().toISOString().split("T")[0],
        buyerBusinessName: row.buyerBusinessName ?? "",
        buyerNTNCNIC: row.buyerNTNCNIC ?? "",
        buyerProvince: row.buyerProvince ?? "Punjab",
        buyerAddress: row.buyerAddress ?? "",
        buyerRegistrationType: row.buyerRegistrationType ?? "Registered",
        sellerBusinessName,
        sellerNTNCNIC,
        sellerProvince,
        sellerAddress,
        items: [
          {
            hsCode: row.hsCode ?? "",
            productDescription: row.productDescription ?? "",
            quantity: row.quantity ?? 1,
            uom: row.uom ?? "Numbers, pieces, units",
            valueSalesExcludingST: row.valueSalesExcludingST ?? 0,
            fixedNotifiedValueOrRetailPrice: 0,
            discount: row.discount ?? 0,
            rate: row.rate ?? "18%",
            salesTaxApplicable: row.salesTaxApplicable ?? 0,
            salesTaxWithheldAtSource: 0,
            extraTax: 0,
            furtherTax: 0,
            saleType: "Goods at standard rate (default)",
            sroScheduleNo: "",
            fedPayable: 0,
            sroItemSerialNo: "",
            totalValues: (row.valueSalesExcludingST ?? 0) + (row.salesTaxApplicable ?? 0),
          },
        ],
      };

      const saveRes = await fetch(`${baseUrl}/api/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        body: JSON.stringify(invoicePayload),
      });

      const saveResult = await saveRes.json() as { invoiceId?: string; error?: string };

      if (!saveRes.ok || !saveResult.invoiceId) {
        failedCount++;
        const rowIdx = updatedRows.findIndex((r) => r.rowIndex === rowIndex);
        if (rowIdx !== -1) {
          updatedRows[rowIdx].submitError = saveResult.error ?? "Failed to save invoice";
          updatedRows[rowIdx].submitted = false;
        }
        continue;
      }

      const invoiceId = saveResult.invoiceId;

      // Step 2: Submit to FBR
      const submitRes = await fetch(`${baseUrl}/api/fbr/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        body: JSON.stringify({ invoiceId }),
      });

      const submitResult = await submitRes.json() as {
        success?: boolean;
        fbrInvoiceNumber?: string;
        error?: string;
        message?: string;
      };

      const rowIdx = updatedRows.findIndex((r) => r.rowIndex === rowIndex);
      if (submitRes.status === 201 && submitResult.success) {
        submittedCount++;
        if (rowIdx !== -1) {
          updatedRows[rowIdx].invoiceId = invoiceId;
          updatedRows[rowIdx].fbrInvoiceNumber = submitResult.fbrInvoiceNumber;
          updatedRows[rowIdx].submitted = true;
        }
      } else {
        failedCount++;
        if (rowIdx !== -1) {
          updatedRows[rowIdx].invoiceId = invoiceId;
          updatedRows[rowIdx].submitError = submitResult.message ?? submitResult.error ?? "FBR submission failed";
          updatedRows[rowIdx].submitted = false;
        }
      }
    } catch (err) {
      failedCount++;
      const rowIdx = updatedRows.findIndex((r) => r.rowIndex === rowIndex);
      if (rowIdx !== -1) {
        updatedRows[rowIdx].submitError = (err as Error).message ?? "Unexpected error";
        updatedRows[rowIdx].submitted = false;
      }
    }
  }

  // Update batch with results
  await db
    .update(bulkInvoiceBatches)
    .set({
      status: failedCount === 0 ? "done" : submittedCount > 0 ? "partial" : "failed",
      submittedRows: submittedCount,
      failedRows: failedCount,
      rows: updatedRows as unknown as Record<string, unknown>[],
      updatedAt: new Date(),
    })
    .where(eq(bulkInvoiceBatches.id, batchId));

  return NextResponse.json({
    success: true,
    batchId,
    submittedCount,
    failedCount,
    totalProcessed: rows.length,
  });
}
