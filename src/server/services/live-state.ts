import { kvGet, kvSet } from "./kv";

export type LiveSignal = {
  sessionId: string;
  type: string;
  sdp: string;
};

export type LiveStatus = {
  isLive: boolean;
  platform: string | null;
  title: string | null;
  embedUrl: string | null;
  nextService: string;
};

const NEXT_SERVICE = "Sunday Celebration Service · Sunday at 8:00 AM";

// WebRTC signaling (offer/answer) used to be module-level variables in the
// Express process. On serverless the offer posted by the broadcaster and the
// answer posted by a viewer would land on different instances, so the state
// is kept in Postgres (app_kv) instead.
type LiveRecord = {
  offer: LiveSignal | null;
  answer: LiveSignal | null;
  title: string | null;
  startedAt: number | null;
};

const KEY = "live";
// A broadcast that was never explicitly stopped (browser closed, etc.) stops
// counting as "live" after this long.
const STALE_AFTER_MS = 12 * 60 * 60 * 1000;

const EMPTY: LiveRecord = { offer: null, answer: null, title: null, startedAt: null };

async function read(): Promise<LiveRecord> {
  const record = await kvGet<LiveRecord>(KEY);
  if (!record || !record.offer) return EMPTY;
  if (record.startedAt && Date.now() - record.startedAt > STALE_AFTER_MS) return EMPTY;
  return record;
}

function toStatus(record: LiveRecord): LiveStatus {
  const isLive = Boolean(record.offer);
  return {
    isLive,
    platform: isLive ? "WebRTC" : null,
    title: isLive ? record.title : null,
    embedUrl: null,
    nextService: NEXT_SERVICE,
  };
}

export async function getLiveStatus(): Promise<LiveStatus> {
  return toStatus(await read());
}

export async function publishOffer(offer: LiveSignal, title: string) {
  await kvSet(KEY, { offer, answer: null, title, startedAt: Date.now() } satisfies LiveRecord);
  return { sessionId: offer.sessionId, title, isLive: true };
}

export async function getOffer() {
  return (await read()).offer;
}

export async function getAnswer(sessionId: string) {
  const record = await read();
  if (record.offer?.sessionId !== sessionId) return null;
  return record.answer;
}

export async function publishAnswer(answer: LiveSignal) {
  const record = await read();
  if (record.offer?.sessionId !== answer.sessionId) return false;
  await kvSet(KEY, { ...record, answer });
  return true;
}

export async function stopLive(sessionId: string) {
  const record = await read();
  if (record.offer?.sessionId !== sessionId) return false;
  await kvSet(KEY, EMPTY);
  return true;
}
