import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Admin-uploaded photos live in Vercel Blob (object storage), NOT on the
// serverless function's disk (which is read-only/ephemeral). This table only
// stores metadata:
//  - `url`      the public Vercel Blob URL (null for the bundled starter
//               photos, which ship as static files in /public/gallery)
//  - `fileName` the blob pathname, or the starter photo's file name
export const galleryPhotosTable = pgTable("gallery_photos", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  url: text("url"),
  originalName: text("original_name"),
  caption: text("caption"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type GalleryPhoto = typeof galleryPhotosTable.$inferSelect;
