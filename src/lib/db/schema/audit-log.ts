/**
 * Audit log schema — append-only table for security-sensitive events.
 *
 * Never update or delete rows; this table is the forensic trail.
 * All PII is excluded from the metadata column.
 * Only internal identifiers (userId) and non-identifying context are stored.
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // nullable — not available for pre-authentication events (e.g. login_failure)
    userId: text("user_id"),

    // Free-form action identifier — keep to the values listed below.
    // Using text instead of pgEnum to avoid a separate migration step.
    // Accepted values:
    //   Auth:    login_success | login_failure | logout | account_locked
    //   Account: password_change | password_reset_requested
    //   Admin:   admin_login | admin_login_failure | admin_reset_password
    //            admin_update_profile | admin_upload_logo
    //   Invoice: invoice_created | invoice_deleted | invoice_submitted
    //   Client:  client_created
    //   Draft:   draft_created | draft_deleted
    //   Security: rate_limit_hit | hibp_breach_blocked
    action: text("action").notNull(),

    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    // Extra context — MUST NOT contain plaintext passwords, tokens, NTN, CNIC,
    // or any other PII.  Only non-identifying metadata (counts, flags, etc.).
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("audit_logs_user_id_idx").on(t.userId),
    index("audit_logs_action_idx").on(t.action),
    index("audit_logs_created_at_idx").on(t.createdAt),
  ]
);

export type AuditLog    = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

/** All accepted action strings */
export type AuditAction =
  | "login_success"
  | "login_failure"
  | "logout"
  | "account_locked"
  | "password_change"
  | "password_reset_requested"
  | "admin_login"
  | "admin_login_failure"
  | "admin_reset_password"
  | "admin_update_profile"
  | "admin_upload_logo"
  | "admin_delete_user"
  | "invoice_created"
  | "invoice_deleted"
  | "invoice_submitted"
  | "client_created"
  | "draft_created"
  | "draft_deleted"
  | "rate_limit_hit"
  | "hibp_breach_blocked";
