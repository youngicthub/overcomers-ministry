import { defineConfig } from "drizzle-kit";
import { readFileSync, existsSync } from "node:fs";
import path from "path";

// `drizzle-kit push` is a standalone CLI — unlike the API server, nothing
// loads artifacts/api-server/.env for it automatically. Do that here so
// `npm run push --workspace=@workspace/db` works without having to export
// DATABASE_URL by hand first. Doesn't override a var already set in the
// shell/CI.
if (!process.env.DATABASE_URL) {
  const envPath = path.join(
    __dirname,
    "../../artifacts/api-server/.env",
  );
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
    "DATABASE_URL is not set. Add it to artifacts/api-server/.env, or export it in your shell before running this command.",
  );
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
