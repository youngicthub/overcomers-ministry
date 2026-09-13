import { Router, type IRouter } from "express";
import {
  CreateConsultationBody,
  CreateConsultationResponse,
  CreateContactMessageBody,
  CreateContactMessageResponse,
  CreatePrayerRequestBody,
  CreatePrayerRequestResponse,
  GetHomeContentResponse,
  GetLiveStatusResponse,
  GetTodayDevotionalResponse,
  ListBlogsQueryParams,
  ListBlogsResponse,
  ListEventsResponse,
  ListMinistriesResponse,
  ListSermonsQueryParams,
  ListSermonsResponse,
  ListTestimoniesResponse,
  RegisterMemberBody,
  RegisterMemberResponse,
} from "@workspace/api-zod";
import {
  db,
  prayerRequestsTable,
  membersTable,
  consultationsTable,
  contactMessagesTable,
} from "@workspace/db";
import { liveStatus } from "../services/live-state";

const router: IRouter = Router();

const ministries = [
  {
    id: "choir",
    name: "Worship & Choir",
    description: "Creating room for people to encounter God through sincere, joyful worship.",
    accent: "01",
  },
  {
    id: "children",
    name: "Children's Church",
    description: "Helping the next generation grow in faith, confidence, and a love for Jesus.",
    accent: "02",
  },
  {
    id: "media",
    name: "Media & Broadcast",
    description: "Carrying the message beyond our walls with excellence, creativity, and care.",
    accent: "03",
  },
  {
    id: "evangelism",
    name: "Evangelism",
    description: "Taking the good news into our communities through practical love and bold faith.",
    accent: "04",
  },
  {
    id: "prayer",
    name: "Prayer Ministry",
    description: "Standing together in prayer for healing, direction, restoration, and breakthrough.",
    accent: "05",
  },
  {
    id: "protocol",
    name: "Protocol & Ushering",
    description: "Making every person feel seen, welcomed, and at home from their first visit.",
    accent: "06",
  },
];

const events = [
  {
    id: 1,
    title: "Sunday Celebration Service",
    description: "A joyful gathering for worship, the Word, and a fresh start to the week.",
    location: "Main Auditorium",
    date: "2026-09-13",
    time: "8:00 AM & 10:00 AM",
    category: "Worship",
  },
  {
    id: 2,
    title: "Midweek Encounter",
    description: "A focused evening of teaching and prayer for the journey ahead.",
    location: "Faith Centre",
    date: "2026-09-16",
    time: "6:00 PM",
    category: "Teaching",
  },
  {
    id: 3,
    title: "Community Outreach Day",
    description: "Serving our neighbours with food, prayer, and practical support.",
    location: "Lagos Mainland",
    date: "2026-09-26",
    time: "9:00 AM",
    category: "Outreach",
  },
];

const sermons = [
  {
    id: 1,
    title: "When Faith Finds Its Voice",
    speaker: "Pastor David Akinyemi",
    description: "Faith grows when we choose to speak God's promises louder than our fear.",
    series: "The Overcomer's Way",
    date: "2026-09-06",
    duration: "42 min",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    audioUrl: null,
  },
  {
    id: 2,
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
    id: 3,
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

const blogs = [
  {
    id: 1,
    title: "What It Means to Live as an Overcomer",
    excerpt: "Overcoming is not pretending the storm is small. It is learning where to stand when the storm arrives.",
    category: "Faith",
    author: "Pastor David Akinyemi",
    date: "2026-09-08",
    readTime: "5 min read",
  },
  {
    id: 2,
    title: "A Table Ready for You",
    excerpt: "There is a place for your story, your questions, and your becoming in the family of God.",
    category: "Belonging",
    author: "Ruth Adeoye",
    date: "2026-09-01",
    readTime: "4 min read",
  },
  {
    id: 3,
    title: "Small Prayers, Faithful Days",
    excerpt: "A simple practice for staying close to God when life feels full and your attention feels divided.",
    category: "Devotional",
    author: "Tomiwa Adebayo",
    date: "2026-08-25",
    readTime: "6 min read",
  },
];

const devotional = {
  verse: "The Lord is my strength and my shield; my heart trusts in him, and he helps me.",
  reference: "Psalm 28:7",
  reflection:
    "You do not have to manufacture strength for today. As you turn your heart toward God, receive the help that is already being offered. Trust is not passive; it is the steady decision to lean your full weight on the One who holds you.",
  prayerPoint: "Lord, teach me to receive Your strength and walk today with a trusting heart.",
  date: "2026-09-12",
};

const testimonies = [
  {
    id: 1,
    name: "Adaeze",
    content:
      "I walked into Overcomers carrying a question and found a family willing to walk with me. Six months later, my faith is alive again.",
    location: "Lagos",
  },
  {
    id: 2,
    name: "Michael",
    content:
      "The prayer ministry stood with my family through a difficult season. We experienced peace before we saw the answer, and that changed everything.",
    location: "Ikeja",
  },
  {
    id: 3,
    name: "Bunmi",
    content:
      "I came for a service, stayed for the people, and discovered a place where I can serve with joy. Overcomers has become home.",
    location: "Yaba",
  },
];

const receipt = (message: string, id?: string | number) => ({
  id: id !== undefined ? String(id) : `submission-${Date.now()}`,
  message,
});

router.get("/home", (_req, res) => {
  const data = GetHomeContentResponse.parse({
    devotional,
    events: events.slice(0, 3),
    sermons: sermons.slice(0, 3),
    blog: blogs[0],
    live: liveStatus,
  });
  res.json(data);
});

router.get("/ministries", (_req, res) => {
  res.json(ListMinistriesResponse.parse(ministries));
});

router.get("/events", (_req, res) => {
  res.json(ListEventsResponse.parse(events));
});

router.get("/sermons", (req, res) => {
  const parsed = ListSermonsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const search = parsed.data.search?.toLowerCase();
  const series = parsed.data.series?.toLowerCase();
  const filtered = sermons.filter((sermon) => {
    const matchesSearch =
      !search ||
      sermon.title.toLowerCase().includes(search) ||
      sermon.speaker.toLowerCase().includes(search) ||
      sermon.description.toLowerCase().includes(search);
    const matchesSeries = !series || sermon.series.toLowerCase() === series;
    return matchesSearch && matchesSeries;
  });
  res.json(ListSermonsResponse.parse(filtered));
});

router.get("/blogs", (req, res) => {
  const parsed = ListBlogsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const search = parsed.data.search?.toLowerCase();
  const category = parsed.data.category?.toLowerCase();
  const filtered = blogs.filter((blog) => {
    const matchesSearch =
      !search ||
      blog.title.toLowerCase().includes(search) ||
      blog.excerpt.toLowerCase().includes(search);
    const matchesCategory =
      !category || blog.category.toLowerCase() === category;
    return matchesSearch && matchesCategory;
  });
  res.json(ListBlogsResponse.parse(filtered));
});

router.get("/devotionals/today", (_req, res) => {
  res.json(GetTodayDevotionalResponse.parse(devotional));
});

router.get("/testimonies", (_req, res) => {
  res.json(ListTestimoniesResponse.parse(testimonies));
});

router.get("/live", (_req, res) => {
  res.json(GetLiveStatusResponse.parse(liveStatus));
});

router.post("/prayers", async (req, res) => {
  const parsed = CreatePrayerRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [row] = await db
      .insert(prayerRequestsTable)
      .values({
        name: parsed.data.name || null,
        request: parsed.data.request,
        anonymous: parsed.data.anonymous,
      })
      .returning();
    res.status(201).json(
      CreatePrayerRequestResponse.parse(
        receipt("Your prayer request has been received. We will stand with you in prayer.", row.id),
      ),
    );
  } catch (err) {
    req.log?.error({ err }, "Failed to save prayer request");
    res.status(500).json({ error: "We could not save your prayer request. Please try again." });
  }
});

router.post("/members", async (req, res) => {
  const parsed = RegisterMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [row] = await db
      .insert(membersTable)
      .values({
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: parsed.data.phone,
        email: parsed.data.email,
        gender: parsed.data.gender,
        occupation: parsed.data.occupation,
        address: parsed.data.address,
        birthday: parsed.data.birthday || null,
        prayerRequest: parsed.data.prayerRequest || null,
      })
      .returning();
    res.status(201).json(
      RegisterMemberResponse.parse(
        receipt("Welcome to the family. Our team will be in touch soon.", row.id),
      ),
    );
  } catch (err) {
    req.log?.error({ err }, "Failed to save member registration");
    res.status(500).json({ error: "We could not save your registration. Please try again." });
  }
});

router.post("/consultations", async (req, res) => {
  const parsed = CreateConsultationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [row] = await db
      .insert(consultationsTable)
      .values({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        subject: parsed.data.subject,
        message: parsed.data.message,
      })
      .returning();
    res.status(201).json(
      CreateConsultationResponse.parse(
        receipt("Your consultation request is safely with our care team.", row.id),
      ),
    );
  } catch (err) {
    req.log?.error({ err }, "Failed to save consultation request");
    res.status(500).json({ error: "We could not save your request. Please try again." });
  }
});

router.post("/contacts", async (req, res) => {
  const parsed = CreateContactMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [row] = await db
      .insert(contactMessagesTable)
      .values({
        name: parsed.data.name,
        email: parsed.data.email,
        message: parsed.data.message,
      })
      .returning();
    res.status(201).json(
      CreateContactMessageResponse.parse(
        receipt("Thanks for reaching out. We will respond as soon as possible.", row.id),
      ),
    );
  } catch (err) {
    req.log?.error({ err }, "Failed to save contact message");
    res.status(500).json({ error: "We could not send your message. Please try again." });
  }
});

export default router;