import type { GalleryPhoto } from "../db";

/** Starter photos ship as static files in /public/gallery; admin uploads are
 * served straight from their Vercel Blob URL. */
export const STARTER_PHOTO_PATH = "/gallery";

export function toPublicGalleryPhoto(photo: GalleryPhoto) {
  return {
    id: photo.id,
    url: photo.url ?? `${STARTER_PHOTO_PATH}/${photo.fileName}`,
    caption: photo.caption,
    createdAt: photo.createdAt.toISOString(),
  };
}
