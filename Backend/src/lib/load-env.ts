/**
 * Minimal, dependency-free .env loader.
 *
 * Node has no built-in, version-safe way to auto-load a .env file across the
 * Node versions this project might run on, and we'd rather not add a new
 * npm dependency just for this. This module reads Backend/.env (if present)
 * and copies any KEY=VALUE pairs into process.env, without overriding
 * variables already set (e.g. by the shell, Docker, or a hosting platform).
 *
 * IMPORTANT: this must be the very first import in src/index.ts, before
 * "./app" (and anything app.ts imports) — src/db reads
 * process.env.DATABASE_URL as soon as it is imported.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import dns from "node:dns";

// Some networks technically have IPv6 "enabled" but don't actually route
// it properly to the internet. Node's default DNS resolution can then
// try an unreachable IPv6 address first for a dual-stack host (like
// Neon's pooler, which publishes both A and AAAA records) and burn the
// whole connection timeout on it before ever trying a working IPv4
// address — turning what should be an instant connection into one that
// intermittently hangs or fails outright. Preferring IPv4 first avoids
// this entire class of flaky-network symptom. (The `db:push`/`db:studio`
// CLI runs as a separate process and doesn't load this file, which is
// why package.json's scripts also set NODE_OPTIONS=--dns-result-order=
// ipv4first directly — both are needed for full coverage.)
dns.setDefaultResultOrder("ipv4first");

function parseAndApply(filePath: string) {
  const content = readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    const isQuoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));
    if (isQuoted) {
      value = value.slice(1, -1);
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const here = path.dirname(fileURLToPath(import.meta.url));

// When bundled (dist/index.mjs), `here` is Backend/dist, so the package
// root is one level up. When run unbundled from src/, it's two levels up
// (src/lib -> src -> package root). Try both, plus the current working
// directory as a last resort for unusual invocation setups.
const candidates = [
  path.resolve(here, "../.env"),
  path.resolve(here, "../../.env"),
  path.resolve(process.cwd(), ".env"),
];

for (const candidate of candidates) {
  if (existsSync(candidate)) {
    parseAndApply(candidate);
    break;
  }
}
