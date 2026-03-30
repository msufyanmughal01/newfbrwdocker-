import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bulkInvoiceBatches } from "@/lib/db/schema/bulk-invoices";
import { eq, and } from "drizzle-orm";

interface InvoiceRow {
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
  ntnVerified?: boolean | null;
  ntnMessage?: string;
  status?: string;
  submitted?: boolean;
  fbrInvoiceNumber?: string;
  submitError?: string;
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { batchId: string };
  const { batchId } = body;

  if (!batchId) {
    return NextResponse.json({ error: "batchId required" }, { status: 400 });
  }

  const batchRows = await db
    .select()
    .from(bulkInvoiceBatches)
    .where(
      and(
        eq(bulkInvoiceBatches.id, batchId),
        eq(bulkInvoiceBatches.userId, session.user.id)
      )
    )
    .limit(1);

  if (batchRows.length === 0) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  const batch = batchRows[0];
  const rows = (batch.rows as unknown as InvoiceRow[]) ?? [];
  const fieldValidRows = rows.filter((r) => r.valid);

  // Collect unique NTNs from field-valid rows
  const uniqueNTNs = [
    ...new Set(
      fieldValidRows
        .map((r) => r.buyerNTNCNIC)
        .filter((ntn): ntn is string => Boolean(ntn))
    ),
  ];

  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const cookieHeader = req.headers.get("cookie") ?? "";

  const ntnResults: Record<string, { verified: boolean; message: string }> = {};

  for (const ntn of uniqueNTNs) {
    try {
      const res = await fetch(`${baseUrl}/api/fbr/verify-ntn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        body: JSON.stringify({ ntnCnic: ntn }),
      });
      const data = await res.json() as {
        statlStatus?: string;
        registrationType?: string;
        warning?: string;
        error?: string;
      };
      if (res.ok && data.statlStatus === "active") {
        ntnResults[ntn] = {
          verified: true,
          message: data.registrationType ?? "FBR Registered",
        };
      } else {
        ntnResults[ntn] = {
          verified: false,
          message: data.warning ?? data.error ?? "Not registered with FBR",
        };
      }
    } catch {
      ntnResults[ntn] = { verified: false, message: "Could not verify with FBR" };
    }
  }

  const updatedRows: InvoiceRow[] = rows.map((row) => {
    if (!row.valid) return row;
    const ntn = row.buyerNTNCNIC;
    if (!ntn) return { ...row, ntnVerified: null, ntnMessage: "NTN not provided" };
    const result = ntnResults[ntn];
    if (!result) return { ...row, ntnVerified: null, ntnMessage: "NTN not checked" };
    return {
      ...row,
      ntnVerified: result.verified,
      ntnMessage: result.message,
      status: result.verified ? "ready" : "ntn-failed",
    };
  });

  const readyCount = updatedRows.filter((r) => r.status === "ready").length;
  const ntnFailedCount = updatedRows.filter((r) => r.status === "ntn-failed").length;

  await db
    .update(bulkInvoiceBatches)
    .set({
      rows: updatedRows as unknown as Record<string, unknown>[],
      status: "verified",
      updatedAt: new Date(),
    })
    .where(eq(bulkInvoiceBatches.id, batchId));

  return NextResponse.json({
    success: true,
    readyCount,
    ntnFailedCount,
    rows: updatedRows,
  });
}
