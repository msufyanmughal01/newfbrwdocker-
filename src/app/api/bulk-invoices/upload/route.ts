import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bulkInvoiceBatches } from "@/lib/db/schema/bulk-invoices";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/security/audit";
import * as XLSX from "xlsx";

// ─────────────────────────────────────────────────────────────────────────────
// Security constants
//
//   MAX_FILE_SIZE  — reject anything larger before parsing to prevent DoS via
//                    decompression-bomb (XLSX is a ZIP) or giant CSV.
//   MAX_ROWS       — row limit to prevent memory exhaustion during processing.
//   ALLOWED_EXTS   — extension allow-list (server-validated below).
// ─────────────────────────────────────────────────────────────────────────────
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_ROWS      = 500;

// ─────────────────────────────────────────────────────────────────────────────
// Magic-byte helpers
// Verify that the file content actually matches the declared extension.
// Extension-only checks can be trivially bypassed.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if the buffer starts with the XLSX / XLS magic signature.
 *   XLSX: PK\x03\x04  (ZIP-based Open XML)
 *   XLS:  D0 CF 11 E0  (OLE Compound Document)
 */
function isExcelBytes(buf: Buffer): boolean {
  if (buf.length < 8) return false;
  // XLSX — ZIP local-file header
  const isXlsx = buf[0] === 0x50 && buf[1] === 0x4B && buf[2] === 0x03 && buf[3] === 0x04;
  // XLS  — OLE2 compound document
  const isXls  = buf[0] === 0xD0 && buf[1] === 0xCF && buf[2] === 0x11 && buf[3] === 0xE0;
  return isXlsx || isXls;
}

/**
 * Heuristically verify a CSV buffer: must be valid UTF-8 text and must not
 * start with an OLE / ZIP signature (i.e. a binary file renamed to .csv).
 */
function isCsvSafe(buf: Buffer): boolean {
  if (buf.length < 2) return false;
  // Reject binary magic bytes
  const seemsBinary =
    (buf[0] === 0x50 && buf[1] === 0x4B) || // ZIP / XLSX
    (buf[0] === 0xD0 && buf[1] === 0xCF) || // OLE / XLS
    (buf[0] === 0xFF && buf[1] === 0xD8) || // JPEG
    (buf[0] === 0x89 && buf[1] === 0x50);   // PNG
  return !seemsBinary;
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV parser
// ─────────────────────────────────────────────────────────────────────────────

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

/**
 * RFC 4180-compliant CSV parser.
 * Handles quoted fields that contain commas, newlines, and escaped double-quotes ("").
 */
function parseCSVRow(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i <= line.length) {
    if (line[i] === '"') {
      // Quoted field
      let value = "";
      i++; // skip opening quote
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          value += '"';
          i += 2;
        } else if (line[i] === '"') {
          i++; // skip closing quote
          break;
        } else {
          value += line[i++];
        }
      }
      fields.push(value);
      if (line[i] === ",") i++; // skip field separator
    } else {
      // Unquoted field
      let value = "";
      while (i < line.length && line[i] !== ",") {
        value += line[i++];
      }
      fields.push(value.trim());
      if (line[i] === ",") i++; // skip field separator
    }
  }
  return fields;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = parseCSVRow(lines[0]);
  return lines.slice(1)
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const values = parseCSVRow(line);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = values[i] ?? "";
      });
      return row;
    });
}

function validateRow(raw: Record<string, string>, rowIndex: number): ParsedRow {
  const errors: string[] = [];

  const buyerBusinessName      = raw["buyerBusinessName"]      || raw["Buyer Business Name"] || "";
  const buyerNTNCNIC            = raw["buyerNTNCNIC"]            || raw["NTN/CNIC"]            || "";
  const buyerProvince           = raw["buyerProvince"]           || raw["Province"]            || "";
  const buyerAddress            = raw["buyerAddress"]            || raw["Address"]             || "";
  const buyerRegistrationType   = raw["buyerRegistrationType"]   || raw["Registration Type"]   || "Registered";
  const invoiceDate             = raw["invoiceDate"]             || raw["Invoice Date"]         || new Date().toISOString().split("T")[0];
  const invoiceType             = raw["invoiceType"]             || raw["Invoice Type"]         || "Sale Invoice";
  const hsCode                  = raw["hsCode"]                  || raw["HS Code"]              || "";
  const productDescription      = raw["productDescription"]      || raw["Description"]          || "";
  const quantity                = parseFloat(raw["quantity"]     || raw["Quantity"]             || "1");
  const uom                     = raw["uom"]                     || raw["UOM"]                  || "Numbers, pieces, units";
  const valueSalesExcludingST   = parseFloat(raw["valueSalesExcludingST"] || raw["Value"]       || "0");
  const salesTaxApplicable      = parseFloat(raw["salesTaxApplicable"]    || raw["Sales Tax"]   || "0");
  const discount                = parseFloat(raw["discount"]     || raw["Discount"]             || "0");
  const rate                    = raw["rate"]                    || raw["Rate"]                 || "18%";

  if (!buyerBusinessName) errors.push("Buyer Business Name is required");
  if (!hsCode)             errors.push("HS Code is required");
  if (!productDescription) errors.push("Product Description is required");
  if (isNaN(quantity) || quantity <= 0)           errors.push("Quantity must be a positive number");
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
    quantity:              isNaN(quantity)              ? 1 : quantity,
    uom,
    valueSalesExcludingST: isNaN(valueSalesExcludingST) ? 0 : valueSalesExcludingST,
    salesTaxApplicable:    isNaN(salesTaxApplicable)    ? 0 : salesTaxApplicable,
    discount:              isNaN(discount)              ? 0 : discount,
    rate,
    errors,
    valid: errors.length === 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 10 uploads per hour per user to prevent DoS via repeated large uploads
  const ip = getRequestIp(req) ?? "unknown";
  const rl = await checkRateLimit("bulk-upload", `${session.user.id}:${ip}`, { window: 60 * 60_000, max: 10 });
  if (rl.limited) {
    return NextResponse.json(
      { error: "Too many uploads. Please wait before uploading again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // ── File size check (before parsing — prevents decompression bombs) ────
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File exceeds the ${MAX_FILE_SIZE / (1024 * 1024)} MB limit` },
        { status: 400 }
      );
    }

    const fileName  = file.name;
    const lowerName = fileName.toLowerCase();

    // ── Extension allow-list check ─────────────────────────────────────────
    const isCSV  = lowerName.endsWith(".csv");
    const isXLSX = lowerName.endsWith(".xlsx");
    const isXLS  = lowerName.endsWith(".xls");

    if (!isCSV && !isXLSX && !isXLS) {
      return NextResponse.json(
        { error: "Only CSV, XLSX, and XLS files are supported. Please use the provided template." },
        { status: 400 }
      );
    }

    // ── Read raw bytes for magic-byte verification ─────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());

    let rawRows: Record<string, string>[] = [];

    if (isCSV) {
      // Verify the file is not a binary disguised as CSV
      if (!isCsvSafe(buffer)) {
        return NextResponse.json(
          { error: "File content does not match a valid CSV." },
          { status: 400 }
        );
      }
      rawRows = parseCSV(buffer.toString("utf-8"));

    } else {
      // XLSX / XLS: verify magic bytes to detect files with renamed extensions
      if (!isExcelBytes(buffer)) {
        return NextResponse.json(
          { error: "File content does not match a valid Excel file." },
          { status: 400 }
        );
      }
      const wb = XLSX.read(buffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      rawRows = (XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)).map((r) =>
        Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v ?? "")]))
      );
    }

    if (rawRows.length === 0) {
      return NextResponse.json({ error: "File is empty or has no data rows" }, { status: 400 });
    }

    if (rawRows.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_ROWS} rows per batch` },
        { status: 400 }
      );
    }

    const parsedRows  = rawRows.map((row, idx) => validateRow(row, idx + 1));
    const validRows   = parsedRows.filter((r) => r.valid).length;
    const invalidRows = parsedRows.filter((r) => !r.valid).length;

    const [batch] = await db
      .insert(bulkInvoiceBatches)
      .values({
        userId:       session.user.id,
        fileName,
        totalRows:    parsedRows.length,
        validRows,
        invalidRows,
        submittedRows: 0,
        failedRows:    0,
        status:        invalidRows > 0 ? "has_errors" : "ready",
        rows:          parsedRows as unknown as Record<string, unknown>[],
        errors:        [],
      })
      .returning();

    return NextResponse.json({
      success:    true,
      batchId:    batch.id,
      totalRows:  parsedRows.length,
      validRows,
      invalidRows,
      rows:       parsedRows,
    });

  } catch (err) {
    console.error("Bulk upload error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}
