import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Articles ("Reflections") are authored by Media Admins from the admin
// dashboard and stored here, so the public /articles (and legacy /blogs)
// pages always read live, database-backed content instead of hardcoded
// sample data.
export const articlesTable = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  // Short teaser shown on list/card views.
  excerpt: text("excerpt").notNull(),
  // Full article body. Rendered as plain paragraphs (split on blank lines)
  // on the public site — no HTML/markdown renderer required.
  content: text("content").notNull(),
  category: text("category").notNull(),
  author: text("author").notNull(),
  coverImageUrl: text("cover_image_url"),
  // Admins can save a draft without publishing it to the public site yet.
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertArticleSchema = createInsertSchema(articlesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articlesTable.$inferSelect;
