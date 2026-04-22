// Lazy-init: Phase-1-Routes importieren das Modul ohne DATABASE_URL, ohne dass
// mysql2 eine Connection versucht. Erst der erste getDb()-Aufruf in Phase 2
// baut den Pool.
import "server-only";
import mysql from "mysql2/promise";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import * as schema from "./schema";

type Db = MySql2Database<typeof schema>;

let cachedDb: Db | null = null;
let cachedPool: mysql.Pool | null = null;

export function getDb(): Db {
  if (cachedDb) return cachedDb;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. See .env.example; Phase 1 uses the dummy endpoints."
    );
  }
  cachedPool = mysql.createPool({
    uri: url,
    waitForConnections: true,
    connectionLimit: 5,
    timezone: "Z",
  });
  cachedDb = drizzle(cachedPool, { schema, mode: "default" });
  return cachedDb;
}

/** Only meaningful after `getDb()` has run. Useful for graceful shutdown in tests. */
export async function closeDb(): Promise<void> {
  if (cachedPool) {
    await cachedPool.end();
    cachedPool = null;
    cachedDb = null;
  }
}

export type { Db };
export { schema };
