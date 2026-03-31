import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql as sqlTag } from "drizzle-orm";
import * as schema from "./schema";

// Neon serverless HTTP driver — lazy init so build-time imports don't require DATABASE_URL
let _db: ReturnType<typeof drizzle<typeof schema>> | undefined;

function getDb() {
  if (!_db) {
    const sql = neon(process.env.DATABASE_URL!);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_, prop) {
    return getDb()[prop as keyof ReturnType<typeof getDb>];
  },
});

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
