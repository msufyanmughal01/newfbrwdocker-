import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema/clients";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: clients.id,
      businessName: clients.businessName,
      ntnCnic: clients.ntnCnic,
      province: clients.province,
      address: clients.address,
      registrationType: clients.registrationType,
      notes: clients.notes,
      createdAt: clients.createdAt,
      updatedAt: clients.updatedAt,
    })
    .from(clients)
    .where(and(eq(clients.userId, session.user.id), eq(clients.isDeleted, false)));

  const headers_csv = [
    "id",
    "businessName",
    "ntnCnic",
    "province",
    "address",
    "registrationType",
    "notes",
    "createdAt",
    "updatedAt",
  ];

  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvLines = [
    headers_csv.join(","),
    ...rows.map((r) =>
      [
        escape(r.id),
        escape(r.businessName),
        escape(r.ntnCnic),
        escape(r.province),
        escape(r.address),
        escape(r.registrationType),
        escape(r.notes),
        escape(r.createdAt?.toISOString()),
        escape(r.updatedAt?.toISOString()),
      ].join(",")
    ),
  ];

  const csv = csvLines.join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clients-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
