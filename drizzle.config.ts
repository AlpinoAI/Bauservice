import type { Config } from "drizzle-kit";

// Read-only Setup: wir erzeugen keine Migrationen, sondern lesen Views, die
// Matthias serverseitig pflegt (siehe docs/sql-views-ddl-vorschlag.md). Die
// Config ist nur für gelegentliche Introspect-Runs via `pnpm drizzle-kit introspect`.
export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "mysql://localhost/bauservice",
  },
} satisfies Config;
