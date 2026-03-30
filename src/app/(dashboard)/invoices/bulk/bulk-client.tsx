"use client";

import { useState, useRef } from "react";
import Link from "next/link";

interface RecentBatch {
  id: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  submittedRows: number;
  failedRows: number;
  status: string;
  createdAt: Date;
}

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

interface UploadResult {
  batchId: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: InvoiceRow[];
}

interface VerifyResult {
  readyCount: number;
  ntnFailedCount: number;
  rows: InvoiceRow[];
}

interface SubmitResult {
  submittedCount: number;
  failedCount: number;
  totalProcessed: number;
}

interface Props {
  recentBatches: RecentBatch[];
}

const TEMPLATE_COLUMNS = [
  "buyerBusinessName",
  "buyerNTNCNIC",
  "buyerProvince",
  "buyerAddress",
  "buyerRegistrationType",
  "invoiceDate",
  "invoiceType",
  "hsCode",
  "productDescription",
  "quantity",
  "uom",
  "valueSalesExcludingST",
  "salesTaxApplicable",
  "discount",
  "rate",
];

const EXAMPLE_ROW: Record<string, string | number> = {
  buyerBusinessName: "Example Trading Co.",
  buyerNTNCNIC: "1234567-8",
  buyerProvince: "Punjab",
  buyerAddress: "Shop 12 Block 5 Karachi",
  buyerRegistrationType: "Registered",
  invoiceDate: "2025-01-15",
  invoiceType: "Sale Invoice",
  hsCode: "6109.1000",
  productDescription: "Cotton T-Shirts",
  quantity: 100,
  uom: "NOS",
  valueSalesExcludingST: 50000,
  salesTaxApplicable: 9000,
  discount: 0,
  rate: "18%",
};

const PLACEHOLDER_ROW: Record<string, string> = {
  buyerBusinessName: "Your Business Name",
  buyerNTNCNIC: "your-ntn-here",
  buyerProvince: "Punjab",
  buyerAddress: "Your Business Address",
  buyerRegistrationType: "Registered",
  invoiceDate: "YYYY-MM-DD",
  invoiceType: "Sale Invoice",
  hsCode: "0000.0000",
  productDescription: "Your Product",
  quantity: "1",
  uom: "NOS",
  valueSalesExcludingST: "0",
  salesTaxApplicable: "0",
  discount: "0",
  rate: "18%",
};

function getBatchStatusStyle(status: string): React.CSSProperties {
  if (status === "done") return { background: "var(--positive-bg)", color: "var(--positive)" };
  if (status === "partial") return { background: "var(--warning-bg)", color: "var(--warning)" };
  if (status === "failed") return { background: "var(--error-bg)", color: "var(--error)" };
  if (status === "verified" || status === "submitting") return { background: "var(--info-bg)", color: "var(--info)" };
  return { background: "var(--surface-2)", color: "var(--foreground-muted)" };
}

export function BulkInvoiceClient({ recentBatches: initialBatches }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [batches, setBatches] = useState<RecentBatch[]>(initialBatches);

  const displayRows = verifyResult?.rows ?? uploadResult?.rows ?? [];

  async function handleTemplateDownload() {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const data = [
      TEMPLATE_COLUMNS.reduce((acc, col) => ({ ...acc, [col]: EXAMPLE_ROW[col] ?? "" }), {}),
      TEMPLATE_COLUMNS.reduce((acc, col) => ({ ...acc, [col]: PLACEHOLDER_ROW[col] ?? "" }), {}),
    ];
    const ws = XLSX.utils.json_to_sheet(data, { header: TEMPLATE_COLUMNS });
    ws["!cols"] = TEMPLATE_COLUMNS.map(() => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    XLSX.writeFile(wb, "taxdigital-bulk-template.xlsx");
    setStep(2);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/bulk-invoices/upload", { method: "POST", body: formData });
      const data = await res.json() as UploadResult & { error?: string };
      if (!res.ok) {
        alert(data.error ?? "Upload failed");
        return;
      }
      setUploadResult(data);
      if (data.validRows > 0) setStep(3);
    } catch (err) {
      alert((err as Error).message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleVerify() {
    if (!uploadResult?.batchId) return;
    setVerifying(true);
    try {
      const res = await fetch("/api/bulk-invoices/verify-ntns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: uploadResult.batchId }),
      });
      const data = await res.json() as VerifyResult & { error?: string };
      if (!res.ok) {
        alert(data.error ?? "Verification failed");
        return;
      }
      setVerifyResult(data);
      setStep(4);
    } catch (err) {
      alert((err as Error).message ?? "Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  async function handleSubmit() {
    if (!uploadResult?.batchId) return;
    setSubmitting(true);
    setSubmitConfirm(false);
    try {
      const res = await fetch("/api/bulk-invoices/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: uploadResult.batchId }),
      });
      const data = await res.json() as SubmitResult & { error?: string };
      if (!res.ok) {
        alert(data.error ?? "Submission failed");
        return;
      }
      setSubmitResult(data);
      // Refresh batches list
      const batchRes = await fetch("/api/bulk-invoices/batches").catch(() => null);
      if (batchRes?.ok) {
        const updated = await batchRes.json() as RecentBatch[];
        setBatches(updated);
      }
    } catch (err) {
      alert((err as Error).message ?? "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  const card: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    padding: "28px",
    marginBottom: "20px",
  };

  const activeCard: React.CSSProperties = {
    ...card,
    border: "1px solid var(--primary)",
    boxShadow: "0 0 0 3px rgba(99,102,241,0.08)",
  };

  const readyCount = verifyResult?.readyCount ?? 0;
  const ntnFailedCount = verifyResult?.ntnFailedCount ?? 0;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 16px" }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>Bulk Invoice Upload</h1>
          <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginTop: "4px" }}>
            Upload invoices in bulk — validate fields, verify FBR registration, then submit.
          </p>
        </div>
        <Link href="/invoices" style={{ fontSize: "14px", color: "var(--foreground-muted)", textDecoration: "none" }}>
          ← Back to Invoices
        </Link>
      </div>

      {/* ── STEP INDICATOR ── */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "32px" }}>
        {(["Download Template", "Upload File", "Verify FBR Registration", "Submit to FBR"] as const).map((label, i) => {
          const stepNum = (i + 1) as 1 | 2 | 3 | 4;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          const color = isDone ? "var(--positive)" : isActive ? "var(--primary)" : "var(--foreground-subtle)";
          return (
            <div key={label} style={{ display: "flex", alignItems: "center", flex: i < 3 ? 1 : 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: isDone ? "var(--positive)" : isActive ? "var(--primary)" : "var(--surface-2)",
                  border: `2px solid ${color}`,
                  color: (isDone || isActive) ? "white" : "var(--foreground-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: 700,
                }}>
                  {isDone ? "✓" : stepNum}
                </div>
                <span style={{ fontSize: "11px", fontWeight: isActive ? 600 : 400, color, whiteSpace: "nowrap" }}>
                  {label}
                </span>
              </div>
              {i < 3 && (
                <div style={{
                  flex: 1,
                  height: "2px",
                  background: step > stepNum ? "var(--positive)" : "var(--border)",
                  margin: "0 8px",
                  marginBottom: "20px",
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── SECTION 1: DOWNLOAD TEMPLATE ── */}
      <div style={step === 1 ? activeCard : card}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <span style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: step === 1 ? "var(--primary)" : "var(--positive)",
            color: "white",
            fontSize: "13px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            {step > 1 ? "✓" : "1"}
          </span>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Download Template</h2>
        </div>
        <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "20px" }}>
          Download the Excel template below. It contains example data showing the exact format required. Fill in your invoice data following the example, then upload it in Step 2.
        </p>

        {/* Preview table */}
        <div style={{ overflowX: "auto", marginBottom: "20px", background: "var(--surface-2)", borderRadius: "8px", border: "1px solid var(--border)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", whiteSpace: "nowrap" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {TEMPLATE_COLUMNS.map((col) => (
                  <th key={col} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "var(--foreground-muted)" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {TEMPLATE_COLUMNS.map((col) => (
                  <td key={col} style={{ padding: "8px 12px", color: "var(--foreground)", borderBottom: "1px solid var(--border)" }}>
                    {String(EXAMPLE_ROW[col] ?? "")}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <button
          onClick={handleTemplateDownload}
          style={{
            background: "var(--primary)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Download Template (.xlsx)
        </button>
      </div>

      {/* ── SECTION 2: UPLOAD FILE ── */}
      <div style={step === 2 ? activeCard : card}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <span style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: step === 2 ? "var(--primary)" : step > 2 ? "var(--positive)" : "var(--surface-2)",
            color: step >= 2 ? "white" : "var(--foreground-subtle)",
            border: `2px solid ${step >= 2 ? (step > 2 ? "var(--positive)" : "var(--primary)") : "var(--border)"}`,
            fontSize: "13px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            {step > 2 ? "✓" : "2"}
          </span>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Upload Your File</h2>
        </div>
        <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "20px" }}>
          Upload your completed Excel or CSV file. We will check all fields for required values and correct formats.
        </p>

        {/* Drop zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? "var(--primary)" : "var(--border)"}`,
            borderRadius: "16px",
            padding: "48px 24px",
            textAlign: "center",
            cursor: "pointer",
            background: dragOver ? "var(--primary-subtle)" : "transparent",
            transition: "all 0.2s",
            marginBottom: "12px",
          }}
        >
          <div style={{ fontSize: "36px", marginBottom: "8px" }}>📁</div>
          <p style={{ fontSize: "15px", color: "var(--foreground-muted)", margin: "0 0 4px" }}>
            Drag and drop your file here
          </p>
          <p style={{ fontSize: "13px", color: "var(--foreground-subtle)", margin: 0 }}>or click to browse</p>
          <p style={{ fontSize: "12px", color: "var(--foreground-subtle)", marginTop: "8px" }}>
            .xlsx .xls .csv accepted · Max 500 rows
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setFile(f);
          }}
        />

        {/* File pill */}
        {file && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--primary-subtle)",
            border: "1px solid var(--primary)",
            borderRadius: "100px",
            padding: "4px 12px",
            fontSize: "13px",
            color: "var(--primary)",
            marginBottom: "16px",
          }}>
            <span>{file.name}</span>
            <button
              onClick={() => setFile(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontWeight: 700, padding: 0, fontSize: "14px" }}
            >
              ×
            </button>
          </div>
        )}

        <br />
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          style={{
            background: "var(--primary)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: (!file || uploading) ? "not-allowed" : "pointer",
            opacity: (!file || uploading) ? 0.5 : 1,
          }}
        >
          {uploading ? "Uploading..." : "Upload and Validate"}
        </button>

        {/* Validation results */}
        {uploadResult && (
          <div style={{ marginTop: "20px" }}>
            <p style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "12px" }}>
              <strong style={{ color: "var(--positive)" }}>{uploadResult.validRows} rows passed field validation</strong>
              {uploadResult.invalidRows > 0 && (
                <> · <strong style={{ color: "var(--error)" }}>{uploadResult.invalidRows} rows have errors</strong></>
              )}
            </p>
            <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "8px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                    <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--foreground-muted)", fontWeight: 600 }}>Row</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--foreground-muted)", fontWeight: 600 }}>Buyer Name</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--foreground-muted)", fontWeight: 600 }}>NTN</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--foreground-muted)", fontWeight: 600 }}>HS Code</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--foreground-muted)", fontWeight: 600 }}>Status</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--foreground-muted)", fontWeight: 600 }}>Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadResult.rows.map((row) => (
                    <tr key={row.rowIndex} style={{
                      background: row.valid ? "var(--positive-bg)" : "var(--error-bg)",
                      borderBottom: "1px solid var(--border)",
                    }}>
                      <td style={{ padding: "8px 12px", color: "var(--foreground-muted)" }}>{row.rowIndex}</td>
                      <td style={{ padding: "8px 12px", color: "var(--foreground)" }}>{row.buyerBusinessName ?? "—"}</td>
                      <td style={{ padding: "8px 12px", color: "var(--foreground-muted)", fontFamily: "monospace" }}>{row.buyerNTNCNIC ?? "—"}</td>
                      <td style={{ padding: "8px 12px", color: "var(--foreground-muted)", fontFamily: "monospace" }}>{row.hsCode ?? "—"}</td>
                      <td style={{ padding: "8px 12px" }}>
                        {row.valid
                          ? <span style={{ color: "var(--positive)", fontWeight: 600 }}>✓ Valid</span>
                          : <span style={{ color: "var(--error)", fontWeight: 600 }}>✗ Invalid</span>}
                      </td>
                      <td style={{ padding: "8px 12px", color: "var(--error)", fontSize: "11px" }}>
                        {row.errors.join("; ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 3: VERIFY FBR REGISTRATION ── */}
      {uploadResult && (
        <div style={step === 3 ? activeCard : card}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <span style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: step === 3 ? "var(--primary)" : step > 3 ? "var(--positive)" : "var(--surface-2)",
              color: step >= 3 ? "white" : "var(--foreground-subtle)",
              border: `2px solid ${step >= 3 ? (step > 3 ? "var(--positive)" : "var(--primary)") : "var(--border)"}`,
              fontSize: "13px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              {step > 3 ? "✓" : "3"}
            </span>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Verify FBR Registration</h2>
          </div>
          <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "16px" }}>
            We will now check each buyer&apos;s NTN against FBR&apos;s registry to confirm they are registered. Only invoices with verified buyers can be submitted.
          </p>
          <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "20px" }}>
            <strong style={{ color: "var(--foreground)" }}>{uploadResult.validRows} invoices</strong> ready for NTN verification.
          </p>

          {verifying ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--foreground-muted)", fontSize: "14px" }}>
              <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
              Checking NTN registrations with FBR...
            </div>
          ) : !verifyResult ? (
            <button
              onClick={handleVerify}
              disabled={uploadResult.validRows === 0}
              style={{
                background: "var(--primary)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: uploadResult.validRows === 0 ? "not-allowed" : "pointer",
                opacity: uploadResult.validRows === 0 ? 0.5 : 1,
              }}
            >
              Verify All NTNs with FBR
            </button>
          ) : (
            <div>
              <p style={{ fontSize: "13px", marginBottom: "12px" }}>
                <strong style={{ color: "var(--positive)" }}>{verifyResult.readyCount} invoices ready to submit</strong>
                {verifyResult.ntnFailedCount > 0 && (
                  <> · <strong style={{ color: "var(--error)" }}>{verifyResult.ntnFailedCount} buyers not registered with FBR (these will be skipped)</strong></>
                )}
              </p>
              <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "8px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--foreground-muted)", fontWeight: 600 }}>Row</th>
                      <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--foreground-muted)", fontWeight: 600 }}>Buyer Name</th>
                      <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--foreground-muted)", fontWeight: 600 }}>NTN</th>
                      <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--foreground-muted)", fontWeight: 600 }}>Field Valid</th>
                      <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--foreground-muted)", fontWeight: 600 }}>FBR Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.map((row) => (
                      <tr key={row.rowIndex} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "8px 12px", color: "var(--foreground-muted)" }}>{row.rowIndex}</td>
                        <td style={{ padding: "8px 12px", color: "var(--foreground)" }}>{row.buyerBusinessName ?? "—"}</td>
                        <td style={{ padding: "8px 12px", color: "var(--foreground-muted)", fontFamily: "monospace" }}>{row.buyerNTNCNIC ?? "—"}</td>
                        <td style={{ padding: "8px 12px" }}>
                          {row.valid
                            ? <span style={{ color: "var(--positive)", fontWeight: 600 }}>✓</span>
                            : <span style={{ color: "var(--error)", fontWeight: 600 }}>✗</span>}
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          {row.ntnVerified === true
                            ? <span style={{ color: "var(--positive)", fontWeight: 600, background: "var(--positive-bg)", padding: "2px 8px", borderRadius: "100px" }}>Registered</span>
                            : row.ntnVerified === false
                            ? <span style={{ color: "var(--error)", fontWeight: 600, background: "var(--error-bg)", padding: "2px 8px", borderRadius: "100px" }}>Not Registered</span>
                            : <span style={{ color: "var(--foreground-subtle)" }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 4: SUBMIT TO FBR ── */}
      {verifyResult && (
        <div style={step === 4 ? activeCard : card}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <span style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: step === 4 ? "var(--primary)" : "var(--surface-2)",
              color: step === 4 ? "white" : "var(--foreground-subtle)",
              border: `2px solid ${step === 4 ? "var(--primary)" : "var(--border)"}`,
              fontSize: "13px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              4
            </span>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Submit to FBR</h2>
          </div>

          {!submitResult ? (
            <>
              <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "20px" }}>
                <strong style={{ color: "var(--foreground)" }}>{readyCount} invoices will be submitted</strong>
                {ntnFailedCount > 0 && (
                  <> · <span style={{ color: "var(--foreground-subtle)" }}>{ntnFailedCount} will be skipped (NTN not registered)</span></>
                )}
              </p>

              {!submitConfirm ? (
                <button
                  onClick={() => setSubmitConfirm(true)}
                  disabled={readyCount === 0}
                  style={{
                    background: "var(--primary)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 20px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: readyCount === 0 ? "not-allowed" : "pointer",
                    opacity: readyCount === 0 ? 0.5 : 1,
                  }}
                >
                  Submit {readyCount} Invoice{readyCount !== 1 ? "s" : ""} to FBR
                </button>
              ) : (
                <div style={{ background: "var(--warning-bg)", border: "1px solid var(--warning)", borderRadius: "12px", padding: "20px" }}>
                  <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>
                    ⚠️ You are about to submit {readyCount} invoice{readyCount !== 1 ? "s" : ""} to FBR. This cannot be undone.
                  </p>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      style={{
                        background: "var(--primary)",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        padding: "10px 20px",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: submitting ? "not-allowed" : "pointer",
                        opacity: submitting ? 0.7 : 1,
                      }}
                    >
                      {submitting ? "Submitting..." : "Confirm Submit"}
                    </button>
                    <button
                      onClick={() => setSubmitConfirm(false)}
                      style={{
                        background: "transparent",
                        color: "var(--foreground-muted)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        padding: "10px 20px",
                        fontSize: "14px",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div>
              <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
                <div style={{ flex: 1, textAlign: "center", background: "var(--positive-bg)", border: "1px solid var(--positive)", borderRadius: "12px", padding: "20px" }}>
                  <div style={{ fontSize: "36px", fontWeight: 800, color: "var(--positive)" }}>{submitResult.submittedCount}</div>
                  <div style={{ fontSize: "13px", color: "var(--positive)", marginTop: "4px" }}>Submitted to FBR</div>
                </div>
                {submitResult.failedCount > 0 && (
                  <div style={{ flex: 1, textAlign: "center", background: "var(--error-bg)", border: "1px solid var(--error)", borderRadius: "12px", padding: "20px" }}>
                    <div style={{ fontSize: "36px", fontWeight: 800, color: "var(--error)" }}>{submitResult.failedCount}</div>
                    <div style={{ fontSize: "13px", color: "var(--error)", marginTop: "4px" }}>Failed</div>
                  </div>
                )}
              </div>
              <Link
                href="/invoices"
                style={{
                  display: "inline-block",
                  background: "var(--primary)",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                View Submitted Invoices
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── RECENT BATCHES ── */}
      <div style={{ ...card, marginTop: "8px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--foreground)", marginBottom: "16px", marginTop: 0 }}>
          Recent Batches
        </h2>
        {batches.length === 0 ? (
          <p style={{ fontSize: "14px", color: "var(--foreground-subtle)", textAlign: "center", padding: "24px 0" }}>
            No batches yet. Download the template and upload your first batch.
          </p>
        ) : (
          <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "8px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                  {["Filename", "Date", "Total", "Valid", "Submitted", "Failed", "Status"].map((h) => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 12px", color: "var(--foreground)", fontFamily: "monospace", fontSize: "12px" }}>{b.fileName}</td>
                    <td style={{ padding: "10px 12px", color: "var(--foreground-muted)" }}>{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: "10px 12px", color: "var(--foreground-muted)" }}>{b.totalRows}</td>
                    <td style={{ padding: "10px 12px", color: "var(--foreground-muted)" }}>{b.validRows}</td>
                    <td style={{ padding: "10px 12px", color: "var(--foreground-muted)" }}>{b.submittedRows}</td>
                    <td style={{ padding: "10px 12px", color: "var(--foreground-muted)" }}>{b.failedRows}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        ...getBatchStatusStyle(b.status),
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "100px",
                      }}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
