import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { name, businessName, email, phone, message } = await req.json();

    if (!name || !businessName || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await resend.emails.send({
      from: "TaxDigital <onboarding@resend.dev>",
      to: process.env.CONTACT_EMAIL ?? "admin@taxdigital.pk",
      subject: `New Enquiry: ${name} — ${businessName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <div style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:24px;border-radius:12px 12px 0 0;">
            <h1 style="color:white;margin:0;font-size:20px;">New Contact Form Submission</h1>
            <p style="color:rgba(255,255,255,0.75);margin:4px 0 0;font-size:14px;">via TaxDigital contact form</p>
          </div>
          <div style="background:#f8faff;border:1px solid #dbeafe;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:12px 8px;font-weight:600;color:#374151;width:140px;">Full Name</td>
                <td style="padding:12px 8px;color:#1d4ed8;">${name}</td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:12px 8px;font-weight:600;color:#374151;">Business</td>
                <td style="padding:12px 8px;color:#1e3a8a;">${businessName}</td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:12px 8px;font-weight:600;color:#374151;">Email</td>
                <td style="padding:12px 8px;"><a href="mailto:${email}" style="color:#2563eb;">${email}</a></td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:12px 8px;font-weight:600;color:#374151;">Phone</td>
                <td style="padding:12px 8px;color:#6b7280;">${phone || "Not provided"}</td>
              </tr>
              ${message ? `<tr>
                <td style="padding:12px 8px;font-weight:600;color:#374151;vertical-align:top;">Message</td>
                <td style="padding:12px 8px;color:#374151;line-height:1.6;">${message}</td>
              </tr>` : ""}
            </table>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
