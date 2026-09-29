import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const prayerRequestsTable = pgTable("prayer_requests", {
  id: serial("id").primaryKey(),
  name: text("name"),
  request: text("request").notNull(),
  anonymous: boolean("anonymous").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPrayerRequestSchema = createInsertSchema(
  prayerRequestsTable,
).omit({ id: true, createdAt: true });
export type InsertPrayerRequest = z.infer<typeof insertPrayerRequestSchema>;
export type PrayerRequest = typeof prayerRequestsTable.$inferSelect;
