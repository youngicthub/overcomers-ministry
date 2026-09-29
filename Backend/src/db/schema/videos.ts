import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Admin-managed video gallery. An admin pastes a YouTube link (any common
// format) or another embeddable video link (Vimeo player URL, direct .mp4,
// Facebook video embed, etc). We store exactly what was pasted as
// `sourceUrl`; the server derives a safe `embedUrl` (and, for YouTube, a
// thumbnail) from it at read time — see src/lib/video-embed.ts.
export const videosTable = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  sourceUrl: text("source_url").notNull(),
  // Optional manual override. If left blank, YouTube thumbnails are
  // derived automatically from the source URL.
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertVideoSchema = createInsertSchema(videosTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videosTable.$inferSelect;
