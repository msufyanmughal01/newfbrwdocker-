import { NextResponse } from "next/server";
import { Resend } from "resend";

// ─────────────────────────────────────────────────────────────────────────────
// Security: input sanitisation helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Escape HTML special characters before embedding user-supplied strings into
 * an HTML email body.  Prevents HTML/script injection in the rendered email.
 */
function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/`/g, "&#x60;");
}

// Maximum accepted length for each field (characters).
const MAX_LENGTHS = {
  name:         100,
  businessName: 200,
  email:        254, // RFC 5321 max email length
  phone:         20,
  message:     2000,
} as const;

// Loose but effective email format check (full RFC validation happens server-side at Resend).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // ── 1. Parse body safely ──────────────────────────────────────────────────
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const body = raw as Record<string, unknown>;
  const name         = typeof body.name         === "string" ? body.name.trim()         : "";
  const businessName = typeof body.businessName === "string" ? body.businessName.trim() : "";
  const email        = typeof body.email        === "string" ? body.email.trim()        : "";
  const phone        = typeof body.phone        === "string" ? body.phone.trim()        : "";
  const message      = typeof body.message      === "string" ? body.message.trim()      : "";

  // ── 2. Required-field checks ──────────────────────────────────────────────
  if (!name || !businessName || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // ── 3. Length limits (prevent oversized payloads / log flooding) ──────────
  if (name.length         > MAX_LENGTHS.name)
    return NextResponse.json({ error: "Name is too long"          }, { status: 400 });
  if (businessName.length > MAX_LENGTHS.businessName)
    return NextResponse.json({ error: "Business name is too long" }, { status: 400 });
  if (email.length        > MAX_LENGTHS.email)
    return NextResponse.json({ error: "Email address is too long" }, { status: 400 });
  if (phone.length        > MAX_LENGTHS.phone)
    return NextResponse.json({ error: "Phone number is too long"  }, { status: 400 });
  if (message.length      > MAX_LENGTHS.message)
    return NextResponse.json({ error: "Message is too long"       }, { status: 400 });

  // ── 4. Format validation ──────────────────────────────────────────────────
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  // Reject newlines in email — prevents email header injection attacks
  if (/[\r\n]/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  // ── 5. Sanitise all user-supplied content before embedding in HTML ─────────
  //       This prevents HTML injection / XSS in the rendered email.
  const safeName         = escapeHtml(name);
  const safeBusinessName = escapeHtml(businessName);
  const safeEmail        = escapeHtml(email);
  const safePhone        = phone   ? escapeHtml(phone)   : null;
  const safeMessage      = message ? escapeHtml(message) : null;

  // ── 6. Send via Resend ────────────────────────────────────────────────────
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: "Easy Digital Invoice <onboarding@resend.dev>",
      to:   process.env.CONTACT_EMAIL ?? "admin@easydigitalinvoice.com",
      // Subject also uses sanitised values (no raw user data outside HTML body)
      subject: `New Enquiry: ${safeName} — ${safeBusinessName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <div style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:24px;border-radius:12px 12px 0 0;">
            <h1 style="color:white;margin:0;font-size:20px;">New Contact Form Submission</h1>
            <p style="color:rgba(255,255,255,0.75);margin:4px 0 0;font-size:14px;">via Easy Digital Invoice contact form</p>
          </div>
          <div style="background:#f8faff;border:1px solid #dbeafe;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:12px 8px;font-weight:600;color:#374151;width:140px;">Full Name</td>
                <td style="padding:12px 8px;color:#1d4ed8;">${safeName}</td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:12px 8px;font-weight:600;color:#374151;">Business</td>
                <td style="padding:12px 8px;color:#1e3a8a;">${safeBusinessName}</td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:12px 8px;font-weight:600;color:#374151;">Email</td>
                <td style="padding:12px 8px;">
                  <a href="mailto:${safeEmail}" style="color:#2563eb;">${safeEmail}</a>
                </td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:12px 8px;font-weight:600;color:#374151;">Phone</td>
                <td style="padding:12px 8px;color:#6b7280;">${safePhone ?? "Not provided"}</td>
              </tr>
              ${safeMessage ? `
              <tr>
                <td style="padding:12px 8px;font-weight:600;color:#374151;vertical-align:top;">Message</td>
                <td style="padding:12px 8px;color:#374151;line-height:1.6;">${safeMessage}</td>
              </tr>` : ""}
            </table>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log only the message — never log req body which may contain PII.
    console.error(
      "Contact form: email send failed —",
      error instanceof Error ? error.message : "unknown error"
    );
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
