type Devotional = {
  verse: string;
  reference: string;
  reflection: string;
  prayerPoint: string;
};

// A two-week rotation. The pool repeats after 14 days rather than needing
// fresh content written forever — plenty of variety for a "today's
// devotional" feature. An admin-editable version (like sermons) is a
// natural next step if the church wants to author these directly instead.
const DEVOTIONAL_POOL: Devotional[] = [
  {
    verse: "The Lord is my strength and my shield; my heart trusts in him, and he helps me.",
    reference: "Psalm 28:7",
    reflection:
      "You do not have to manufacture strength for today. As you turn your heart toward God, receive the help that is already being offered. Trust is not passive; it is the steady decision to lean your full weight on the One who holds you.",
    prayerPoint: "Lord, teach me to receive Your strength and walk today with a trusting heart.",
  },
  {
    verse: "Be still, and know that I am God.",
    reference: "Psalm 46:10",
    reflection:
      "Stillness is not the absence of a battle; it is the presence of a Protector. When the noise of the day tries to convince you that you must fix everything yourself, this is your invitation to exhale and remember who is actually in charge.",
    prayerPoint: "Lord, quiet my anxious thoughts and remind me that You are already at work.",
  },
  {
    verse: "I can do all things through him who strengthens me.",
    reference: "Philippians 4:13",
    reflection:
      "This is not a promise that life will be easy; it is a promise that you will not carry it alone. Whatever today asks of you, Christ's strength is available in the exact moment you need it, not a moment before.",
    prayerPoint: "Lord, meet me in today's demands with Your strength, not my own.",
  },
  {
    verse: "The Lord your God is with you, the Mighty Warrior who saves.",
    reference: "Zephaniah 3:17",
    reflection:
      "You are not managing today's challenges from a distance while God watches from far away. He is present, near, and actively fighting on your behalf, even in the ordinary moments that don't feel like a battlefield.",
    prayerPoint: "Lord, help me feel Your nearness in the middle of an ordinary day.",
  },
  {
    verse: "He heals the brokenhearted and binds up their wounds.",
    reference: "Psalm 147:3",
    reflection:
      "Whatever ache you are carrying today, it has not gone unnoticed. Healing with God is rarely instant, but it is always personal — He does not rush your process, and He does not overlook your pain.",
    prayerPoint: "Lord, tend to the parts of my heart I have not shown anyone else.",
  },
  {
    verse: "Cast all your anxiety on him because he cares for you.",
    reference: "1 Peter 5:7",
    reflection:
      "Carrying worry alone is exhausting because it was never meant to be carried alone. Casting it on God is not weakness; it is trust in someone whose shoulders were made for exactly this.",
    prayerPoint: "Lord, I hand You what I have been gripping too tightly.",
  },
  {
    verse: "This is the day that the Lord has made; let us rejoice and be glad in it.",
    reference: "Psalm 118:24",
    reflection:
      "Joy today is not dependent on today being easy. It is a decision to notice that this day, exactly as it is, was made with intention, and that intention includes you.",
    prayerPoint: "Lord, open my eyes to a reason to be glad today.",
  },
  {
    verse: "Come to me, all you who are weary and burdened, and I will give you rest.",
    reference: "Matthew 11:28",
    reflection:
      "Rest is not something you have to earn before you're allowed to approach God. It is the very thing He offers when you come as you are, tired and unfinished, and let Him carry what you cannot.",
    prayerPoint: "Lord, I come to You tired. Teach me what it means to actually rest in You.",
  },
  {
    verse: "For I know the plans I have for you, plans to prosper you and not to harm you, plans to give you hope and a future.",
    reference: "Jeremiah 29:11",
    reflection:
      "Uncertainty about tomorrow does not mean God is uncertain about you. His plans were never dependent on you having it all figured out; they were always dependent on His faithfulness.",
    prayerPoint: "Lord, help me trust Your plan even in a season I don't fully understand.",
  },
  {
    verse: "The Lord is my shepherd; I shall not want.",
    reference: "Psalm 23:1",
    reflection:
      "A good shepherd does not just protect the sheep from danger; he leads them somewhere good. Wherever today takes you, you are being led, not abandoned to figure it out alone.",
    prayerPoint: "Lord, help me follow where You lead instead of running ahead in fear.",
  },
  {
    verse: "Let all that you do be done in love.",
    reference: "1 Corinthians 16:14",
    reflection:
      "Love is not reserved for the easy interactions of your day. It is meant to shape the hard conversation, the tiring task, and the person who tests your patience most.",
    prayerPoint: "Lord, let love be the posture behind everything I do today, especially the hard parts.",
  },
  {
    verse: "Trust in the Lord with all your heart, and do not lean on your own understanding.",
    reference: "Proverbs 3:5",
    reflection:
      "Not having a plan for every outcome is not a failure of faith; it is often the beginning of it. Trust grows exactly in the space where your own understanding runs out.",
    prayerPoint: "Lord, where I don't have clarity, give me trust instead.",
  },
  {
    verse: "The joy of the Lord is your strength.",
    reference: "Nehemiah 8:10",
    reflection:
      "Joy rooted in God is sturdier than joy rooted in circumstances, because circumstances change and He does not. That kind of joy can hold steady even on a hard day.",
    prayerPoint: "Lord, root my joy in You today, not in how the day is going.",
  },
  {
    verse: "And we know that in all things God works for the good of those who love him.",
    reference: "Romans 8:28",
    reflection:
      "This is not a promise that every single thing happening to you is good. It is a promise that nothing is wasted — God is able to work even through what's difficult, for a purpose you may not see yet.",
    prayerPoint: "Lord, help me trust Your goodness even in what I don't yet understand.",
  },
];

function dayOfYear(date: Date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const current = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((current - start) / 86_400_000);
}

function todayIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** Deterministically rotates through the devotional pool by calendar day
 * (UTC), so every visitor sees the same devotional on a given day, and it
 * changes automatically at midnight without any admin action or stored
 * state. */
export function getTodaysDevotional() {
  const now = new Date();
  const index = dayOfYear(now) % DEVOTIONAL_POOL.length;
  return { ...DEVOTIONAL_POOL[index], date: todayIso(now) };
}
