// GET /api/admin/user-password — REMOVED
//
// Plaintext password retrieval has been disabled.
// Passwords are now stored as irreversible scrypt hashes and cannot be decrypted.
// To help a user regain access, use POST /api/admin/reset-user-password
// which sends a secure password-reset email.

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error:
        "Plaintext password retrieval is permanently disabled. " +
        "Use POST /api/admin/reset-user-password to send the user a password-reset email.",
    },
    { status: 410 }
  );
}
