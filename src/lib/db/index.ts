import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql as sqlTag } from "drizzle-orm";
import * as schema from "./schema";

// Neon serverless HTTP driver — ideal for edge/serverless environments
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

/**
 * Wraps a database operation in a transaction with RLS tenant context set.
 * Sets `app.current_user_id` as a LOCAL (transaction-scoped) config.
 */
export async function withTenantContext<T>(
  userId: string,
  fn: (tx: typeof db) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sqlTag`SELECT set_config('app.current_user_id', ${userId}, true)`
    );
    return fn(tx as unknown as typeof db);
  });
}
