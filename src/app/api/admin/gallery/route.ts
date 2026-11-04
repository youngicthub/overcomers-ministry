import { desc } from "drizzle-orm";
import { z } from "zod/v4";
import { db, galleryPhotosTable } from "@/server/db";
import { requireAdmin } from "@/server/lib/admin-guard";
import { badRequest, json, readJson, route } from "@/server/lib/http";
import { ensureGallerySeeded } from "@/server/services/gallery-seed";
import { toPublicGalleryPhoto } from "@/server/services/gallery";

const MAX_FILES_PER_UPLOAD = 10;

// Only accept URLs that really point at Vercel Blob storage, so an admin
// (or a stolen session) can't register arbitrary external URLs as "uploads".
const blobUrl = z
  .string()
  .url()
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname.endsWith(".public.blob.vercel-storage.com");
    } catch {
      return false;
    }
  }, "Photo URL must be a Vercel Blob URL.");

const RegisterBody = z.object({
  photos: z
    .array(z.object({ url: blobUrl, originalName: z.string().max(255).optional() }))
    .min(1, "Choose at least one photo to upload.")
    .max(MAX_FILES_PER_UPLOAD, `You can upload up to ${MAX_FILES_PER_UPLOAD} photos at a time.`),
  caption: z.string().trim().max(300).nullish(),
});

export const GET = route(async (req) => {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  await ensureGallerySeeded();
  const rows = await db
    .select()
    .from(galleryPhotosTable)
    .orderBy(desc(galleryPhotosTable.createdAt), desc(galleryPhotosTable.id));
  return json(rows.map(toPublicGalleryPhoto));
});

// Photos are uploaded straight from the browser to Vercel Blob (see
// ./upload/route.ts); this endpoint then records the resulting URLs.
export const POST = route(async (req) => {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  const parsed = RegisterBody.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid upload.");

  const caption = parsed.data.caption || null;
  const rows = await db
    .insert(galleryPhotosTable)
    .values(
      parsed.data.photos.map((photo) => ({
        fileName: decodeURIComponent(new URL(photo.url).pathname.replace(/^\//, "")),
        url: photo.url,
        originalName: photo.originalName ?? null,
        caption,
      })),
    )
    .returning();

  return json(rows.map(toPublicGalleryPhoto), 201);
});
