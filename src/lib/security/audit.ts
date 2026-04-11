/**
 * Audit logging service.
 *
 * Fire-and-forget: logAuditEvent() never throws and never blocks the request.
 * All write failures are logged as warnings to stderr, not propagated.
 *
 * Usage:
 *   import { logAuditEvent } from "@/lib/security/audit";
 *
 *   logAuditEvent({
 *     action:    "invoice_created",
 *     userId:    session.user.id,
 *     ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
 *     metadata:  { invoiceId: "..." },   // no PII!
 *   });
 *
 * IMPORTANT — metadata must never contain:
 *   passwords, tokens, NTN, CNIC, STRN, or any plaintext sensitive value.
 */

import type { AuditAction } from "@/lib/db/schema/audit-log";

interface AuditEventOptions {
  action:     AuditAction;
  userId?:    string;
  ipAddress?: string;
  userAgent?: string;
  /** Non-PII metadata only */
  metadata?:  Record<string, unknown>;
}

/**
 * Write an audit event to the database.
 * Resolves immediately; the DB insert happens asynchronously.
 */
export function logAuditEvent(opts: AuditEventOptions): void {
  // Dynamic import avoids circular dependency and keeps the edge runtime happy
  Promise.resolve()
    .then(async () => {
      const { db }        = await import("@/lib/db");
      const { auditLogs } = await import("@/lib/db/schema/audit-log");

      await db.insert(auditLogs).values({
        action:    opts.action,
        userId:    opts.userId    ?? null,
        ipAddress: opts.ipAddress ?? null,
        userAgent: opts.userAgent ?? null,
        metadata:  opts.metadata  ?? null,
      });
    })
    .catch((err: unknown) => {
      console.warn(
        "[audit] Failed to write event:",
        err instanceof Error ? err.message : err
      );
    });
}

/** Convenience: extract IP from a Request / NextRequest */
export function getRequestIp(req: Request): string | undefined {
  const headers = req.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    headers.get("x-real-ip") ??
    undefined
  );
}
