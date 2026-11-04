import { db, galleryPhotosTable } from "../db";
import { seedOnce } from "./kv";

// Starter gallery: the Cultural Day photos bundled in /public/gallery. The
// first time the gallery is requested on an empty database they are
// registered in the table (the files themselves are already served as static
// assets). After that they're ordinary photos — admins can delete them or
// add more from the dashboard's Gallery tab.
// Listed in DISPLAY order (first = shown first on the site). The first
// eight are also the ones the Home page's "Moments from our community"
// strip shows, so they're a deliberate mix of portrait and landscape.
const SEED_PHOTOS = [
  // --- First eight: shown on the Home page strip ---
  { fileName: "cultural-day-2266.jpg", caption: "Cultural Day — dance in the sanctuary" },
  { fileName: "cultural-day-2275.jpg", caption: "Cultural Day — in traditional attire" },
  { fileName: "cultural-day-2310.jpg", caption: "Cultural Day — everyone together" },
  { fileName: "cultural-day-2281.jpg", caption: "Cultural Day — our little ones" },
  { fileName: "cultural-day-2280.jpg", caption: "Cultural Day — cutting the cake together" },
  { fileName: "cultural-day-2311.jpg", caption: "Cultural Day — joy and fellowship" },
  { fileName: "cultural-day-2267.jpg", caption: "Cultural Day — the congregation celebrates" },
  { fileName: "cultural-day-2272.jpg", caption: "Cultural Day — dancers in orange and white" },
  // --- The rest of the gallery ---
  { fileName: "cultural-day-2271.jpg", caption: "Cultural Day — family and friends together" },
  { fileName: "cultural-day-2289.jpg", caption: "Cultural Day — young and old together" },
  { fileName: "cultural-day-2277.jpg", caption: "Cultural Day — in orange and gold" },
  { fileName: "cultural-day-2269.jpg", caption: "Cultural Day — dressed for the celebration" },
  { fileName: "cultural-day-2274.jpg", caption: "Cultural Day — the young dancers" },
  { fileName: "cultural-day-2290.jpg", caption: "Cultural Day — dressed for the occasion" },
  { fileName: "cultural-day-2292.jpg", caption: "Cultural Day — big smiles" },
  { fileName: "cultural-day-2282.jpg", caption: "Cultural Day — a family portrait" },
  { fileName: "cultural-day-2283.jpg", caption: "Cultural Day — friends dressed to celebrate" },
  { fileName: "cultural-day-2270.jpg", caption: "Cultural Day — a warm welcome" },
  { fileName: "cultural-day-2273.jpg", caption: "Cultural Day — a young member in traditional dress" },
  { fileName: "cultural-day-2276.jpg", caption: "Cultural Day — a proud smile" },
  { fileName: "cultural-day-2278.jpg", caption: "Cultural Day — Sunday 4 October" },
  { fileName: "cultural-day-2279.jpg", caption: "Cultural Day — striking a pose" },
  { fileName: "cultural-day-2284.jpg", caption: "Cultural Day — a joyful pair" },
  { fileName: "cultural-day-2285.jpg", caption: "Cultural Day — fellowship" },
  { fileName: "cultural-day-2286.jpg", caption: "Cultural Day — a warm moment together" },
  { fileName: "cultural-day-2287.jpg", caption: "Cultural Day — smiles all around" },
  { fileName: "cultural-day-2288.jpg", caption: "Cultural Day — in blue and gold" },
  { fileName: "cultural-day-2291.jpg", caption: "Cultural Day — a graceful pose" },
  { fileName: "cultural-day-2293.jpg", caption: "Cultural Day — elegance in purple" },
  { fileName: "cultural-day-2294.jpg", caption: "Cultural Day — standing tall" },
];

/** Safe to call from every gallery request: the database-backed flag in
 * seedOnce() guarantees the starter photos are inserted at most once, ever,
 * even with many serverless instances starting at the same time. */
export function ensureGallerySeeded() {
  return seedOnce("gallery", async () => {
    const existing = await db.select({ id: galleryPhotosTable.id }).from(galleryPhotosTable).limit(1);
    if (existing.length > 0) return;
    // The public/admin lists sort newest-first (createdAt, then id), and rows
    // inserted in one statement share a createdAt — so insert in reverse to
    // make the first entry above get the highest id.
    await db.insert(galleryPhotosTable).values(
      [...SEED_PHOTOS].reverse().map((photo) => ({
        fileName: photo.fileName,
        url: null,
        originalName: photo.fileName,
        caption: photo.caption,
      })),
    );
  });
}
