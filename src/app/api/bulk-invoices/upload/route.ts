import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bulkInvoiceBatches } from "@/lib/db/schema/bulk-invoices";
import * as XLSX from "xlsx";

interface ParsedRow {
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
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    return row;
  });
}

function validateRow(raw: Record<string, string>, rowIndex: number): ParsedRow {
  const errors: string[] = [];

  const buyerBusinessName = raw["buyerBusinessName"] || raw["Buyer Business Name"] || "";
  const buyerNTNCNIC = raw["buyerNTNCNIC"] || raw["NTN/CNIC"] || "";
  const buyerProvince = raw["buyerProvince"] || raw["Province"] || "";
  const buyerAddress = raw["buyerAddress"] || raw["Address"] || "";
  const buyerRegistrationType = raw["buyerRegistrationType"] || raw["Registration Type"] || "Registered";
  const invoiceDate = raw["invoiceDate"] || raw["Invoice Date"] || new Date().toISOString().split("T")[0];
  const invoiceType = raw["invoiceType"] || raw["Invoice Type"] || "Sale Invoice";
  const hsCode = raw["hsCode"] || raw["HS Code"] || "";
  const productDescription = raw["productDescription"] || raw["Description"] || "";
  const quantity = parseFloat(raw["quantity"] || raw["Quantity"] || "1");
  const uom = raw["uom"] || raw["UOM"] || "Numbers, pieces, units";
  const valueSalesExcludingST = parseFloat(raw["valueSalesExcludingST"] || raw["Value"] || "0");
  const salesTaxApplicable = parseFloat(raw["salesTaxApplicable"] || raw["Sales Tax"] || "0");
  const discount = parseFloat(raw["discount"] || raw["Discount"] || "0");
  const rate = raw["rate"] || raw["Rate"] || "18%";

  if (!buyerBusinessName) errors.push("Buyer Business Name is required");
  if (!hsCode) errors.push("HS Code is required");
  if (!productDescription) errors.push("Product Description is required");
  if (isNaN(quantity) || quantity <= 0) errors.push("Quantity must be a positive number");
  if (isNaN(valueSalesExcludingST) || valueSalesExcludingST < 0) errors.push("Value must be non-negative");
  if (!invoiceDate.match(/^\d{4}-\d{2}-\d{2}$/)) errors.push("Invoice Date must be YYYY-MM-DD format");

  return {
    rowIndex,
    buyerBusinessName,
    buyerNTNCNIC,
    buyerProvince,
    buyerAddress,
    buyerRegistrationType,
    invoiceDate,
    invoiceType,
    hsCode,
    productDescription,
    quantity: isNaN(quantity) ? 1 : quantity,
    uom,
    valueSalesExcludingST: isNaN(valueSalesExcludingST) ? 0 : valueSalesExcludingST,
    salesTaxApplicable: isNaN(salesTaxApplicable) ? 0 : salesTaxApplicable,
    discount: isNaN(discount) ? 0 : discount,
    rate,
    errors,
    valid: errors.length === 0,
  };
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileName = file.name;
    const text = await file.text();

    let rawRows: Record<string, string>[] = [];

    if (fileName.endsWith(".csv")) {
      rawRows = parseCSV(text);
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      rawRows = (XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)).map((r) =>
        Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v ?? "")]))
      );
    } else {
      return NextResponse.json(
        { error: "Only CSV, XLSX, and XLS files are supported. Please use the provided template." },
        { status: 400 }
      );
    }

    if (rawRows.length === 0) {
      return NextResponse.json({ error: "File is empty or has no data rows" }, { status: 400 });
    }

    if (rawRows.length > 500) {
      return NextResponse.json({ error: "Maximum 500 rows per batch" }, { status: 400 });
    }

    const parsedRows = rawRows.map((row, idx) => validateRow(row, idx + 1));
    const validRows = parsedRows.filter((r) => r.valid).length;
    const invalidRows = parsedRows.filter((r) => !r.valid).length;

    const [batch] = await db
      .insert(bulkInvoiceBatches)
      .values({
        userId: session.user.id,
        fileName,
        totalRows: parsedRows.length,
        validRows,
        invalidRows,
        submittedRows: 0,
        failedRows: 0,
        status: invalidRows > 0 ? "has_errors" : "ready",
        rows: parsedRows as unknown as Record<string, unknown>[],
        errors: [],
      })
      .returning();

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      totalRows: parsedRows.length,
      validRows,
      invalidRows,
      rows: parsedRows,
    });
  } catch (err) {
    console.error("Bulk upload error:", err);
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}
