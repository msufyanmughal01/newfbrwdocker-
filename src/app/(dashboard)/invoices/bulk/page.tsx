import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { bulkInvoiceBatches } from "@/lib/db/schema/bulk-invoices";
import { eq, desc } from "drizzle-orm";
import { BulkInvoiceClient } from "./bulk-client";

export const metadata = {
  title: "Bulk Invoice Upload | Easy Digital Invoice",
};

export default async function BulkInvoicePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const recentBatches = await db
    .select({
      id: bulkInvoiceBatches.id,
      fileName: bulkInvoiceBatches.fileName,
      totalRows: bulkInvoiceBatches.totalRows,
      validRows: bulkInvoiceBatches.validRows,
      invalidRows: bulkInvoiceBatches.invalidRows,
      submittedRows: bulkInvoiceBatches.submittedRows,
      failedRows: bulkInvoiceBatches.failedRows,
      status: bulkInvoiceBatches.status,
      createdAt: bulkInvoiceBatches.createdAt,
    })
    .from(bulkInvoiceBatches)
    .where(eq(bulkInvoiceBatches.userId, session.user.id))
    .orderBy(desc(bulkInvoiceBatches.createdAt))
    .limit(10);

  return <BulkInvoiceClient recentBatches={recentBatches} />;
}
