import { pgTable, serial, text, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sermonsTable = pgTable("sermons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  speaker: text("speaker").notNull(),
  description: text("description").notNull(),
  series: text("series").notNull(),
  date: date("date").notNull(),
  duration: text("duration").notNull(),
  videoUrl: text("video_url"),
  audioUrl: text("audio_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSermonSchema = createInsertSchema(sermonsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSermon = z.infer<typeof insertSermonSchema>;
export type Sermon = typeof sermonsTable.$inferSelect;
