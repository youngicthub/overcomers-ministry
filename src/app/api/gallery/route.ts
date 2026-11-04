import { desc } from "drizzle-orm";
import { db, galleryPhotosTable } from "@/server/db";
import { json, PUBLIC_CACHE, route } from "@/server/lib/http";
import { ensureGallerySeeded } from "@/server/services/gallery-seed";
import { toPublicGalleryPhoto } from "@/server/services/gallery";

export const GET = route(async () => {
  await ensureGallerySeeded();
  const rows = await db
    .select()
    .from(galleryPhotosTable)
    .orderBy(desc(galleryPhotosTable.createdAt), desc(galleryPhotosTable.id));
  return json(rows.map(toPublicGalleryPhoto), 200, PUBLIC_CACHE);
});
