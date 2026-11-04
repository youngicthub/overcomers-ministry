import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Fixed-window counters shared by every serverless instance. Used for
// per-IP rate limits and the per-admin-ID login lockout. Keys that hold an
// IP are stored as a salted hash, never the raw address.
export const rateLimitsTable = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});
