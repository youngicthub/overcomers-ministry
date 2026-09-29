import { defineConfig } from "drizzle-kit";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import dns from "node:dns";

// See src/lib/load-env.ts for why: prefer IPv4 to avoid hanging on a
// broken IPv6 route to a dual-stack host (e.g. Neon's pooler).
dns.setDefaultResultOrder("ipv4first");

// `drizzle-kit push` is a standalone CLI and does not load .env on its own.
// Load Backend/.env here so `npm run db:push` works without exporting
// DATABASE_URL by hand first. Never overrides a var already set in the
// shell/CI.
if (!process.env.DATABASE_URL) {
  const envPath = path.join(__dirname, ".env");
  if (existsSync(envPath)) {
    for (const rawLine of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eqIndex = line.indexOf("=");
      if (eqIndex === -1) continue;
      const key = line.slice(0, eqIndex).trim();
      let value = line.slice(eqIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Add it to Backend/.env, or export it in your shell before running this command.",
  );
}

export default defineConfig({
  schema: path.join(__dirname, "./src/db/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
