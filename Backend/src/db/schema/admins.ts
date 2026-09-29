import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const adminsTable = pgTable("admins", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  // scrypt hash produced by src/lib/password.ts — never a plaintext
  // password, and never sent back in any API response.
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Admin = typeof adminsTable.$inferSelect;
