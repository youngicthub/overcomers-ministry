import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'drizzle-kit';

// Loads .env / .env.local the same way `next dev` does, so `npm run db:push`
// works without exporting DATABASE_URL by hand. Never overrides variables
// already set in the shell/CI.
loadEnvConfig(process.cwd());

const raw = process.env.DATABASE_URL;
if (!raw) {
  throw new Error('DATABASE_URL is not set. Add it to .env.local, or export it in your shell, then re-run.');
}

// Neon's default string includes "&channel_binding=require", which
// node-postgres can hang on. TLS (sslmode=require) is still enforced.
function cleaned(url: string) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete('channel_binding');
    return parsed.toString();
  } catch {
    return url;
  }
}

export default defineConfig({
  schema: './src/server/db/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: { url: cleaned(raw) },
});
