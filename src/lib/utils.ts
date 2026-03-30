import { headers } from "next/headers";
import { auth } from "./auth";

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  return {
    session,
    user: session.user,
    userId: session.user.id,
  };
}

export async function getSessionWithRole(): Promise<{
  session: Awaited<ReturnType<typeof getSession>>["session"];
  user: Awaited<ReturnType<typeof getSession>>["user"];
  userId?: string;
  role: string;
  organizationId: string;
  organization: Record<string, unknown>;
}> {
  const base = await getSession();
  return {
    ...base,
    role: "",
    organizationId: "",
    organization: {},
  };
}

const ROLE_LEVELS: Record<string, number> = {
  owner: 3,
  operator: 2,
  accountant: 1,
};

export function requireRole(userRole: string, requiredRole: string): void {
  const userLevel = ROLE_LEVELS[userRole] ?? 0;
  const requiredLevel = ROLE_LEVELS[requiredRole] ?? 0;
  if (userLevel < requiredLevel) {
    throw new Error("FORBIDDEN");
  }
}
