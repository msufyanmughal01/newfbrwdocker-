"use client";

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  userRole?: string;
  fallback?: React.ReactNode;
}

export function RoleGate({ children }: RoleGateProps) {
  return <>{children}</>;
}
