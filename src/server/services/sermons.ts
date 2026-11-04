import { db, sermonsTable } from "../db";
import { seedOnce } from "./kv";

const DEFAULT_SERMONS = [
  {
    title: "When Faith Finds Its Voice",
    speaker: "Pastor David Akinyemi",
    description:
      "Faith grows when we choose to speak God's promises louder than our fear.",
    series: "The Overcomer's Way",
    date: "2026-09-06",
    duration: "42 min",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    audioUrl: null,
  },
  {
    title: "Grace for the Next Step",
    speaker: "Pastor Ruth Adeoye",
    description: "You do not need the whole map to take the next faithful step.",
    series: "Grace in Motion",
    date: "2026-08-30",
    duration: "38 min",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    audioUrl: null,
  },
  {
    title: "Built for Belonging",
    speaker: "Pastor David Akinyemi",
    description: "The church is not a crowd you attend; it is a family where you grow.",
    series: "The House We Build",
    date: "2026-08-23",
    duration: "51 min",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    audioUrl: null,
  },
];

// Seeds the three sample sermons once, on a database whose sermons table is
// empty, so the public page isn't blank on day one. Admins can edit or delete
// them like any other sermon afterwards.
export function ensureSermonsSeeded() {
  return seedOnce("sermons", async () => {
    const existing = await db.select({ id: sermonsTable.id }).from(sermonsTable).limit(1);
    if (existing.length === 0) {
      await db.insert(sermonsTable).values(DEFAULT_SERMONS);
    }
  });
}
