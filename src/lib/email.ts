import { Resend } from "resend";

const FROM_EMAIL = "TaxDigital <onboarding@resend.dev>";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendPasswordResetEmail({
  to,
  resetLink,
}: {
  to: string;
  resetLink: string;
}) {
  await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Reset your password",
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
    `,
  });
}

export async function sendInvitationEmail({
  to,
  inviterName,
  inviterEmail,
  organizationName,
  inviteLink,
}: {
  to: string;
  inviterName: string;
  inviterEmail: string;
  organizationName: string;
  inviteLink: string;
}) {
  await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `You've been invited to join ${organizationName}`,
    html: `
      <h2>Organization Invitation</h2>
      <p>${inviterName} (${inviterEmail}) has invited you to join <strong>${organizationName}</strong> on TaxDigital.</p>
      <a href="${inviteLink}">Accept Invitation</a>
      <p>If you did not expect this invitation, you can ignore this email.</p>
    `,
  });
}
