import { NextResponse } from "next/server";

// GET /api/health — liveness probe used by Docker and load-balancers.
// SECURITY: Do NOT expose version, environment, dependency info, or any
// internal state here.  Any information returned is publicly readable.
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
