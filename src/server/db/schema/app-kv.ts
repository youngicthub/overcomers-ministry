import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Tiny key/value store for state that used to live in server memory and
// therefore cannot work on serverless (every request may hit a different
// instance): live-broadcast signaling and one-time "already seeded" flags.
export const appKvTable = pgTable("app_kv", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
