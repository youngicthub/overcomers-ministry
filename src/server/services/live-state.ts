import { kvDeleteByPrefix, kvGet, kvGetByPrefix, kvSet } from "./kv";
import { ConfigError } from "@/server/lib/config";

export type LiveSignal = {
  sessionId: string;
  type: string;
  sdp: string;
};

export type LiveSession = {
  sessionId: string;
};

export type LiveStatus = {
  isLive: boolean;
  platform: string | null;
  title: string | null;
  embedUrl: string | null;
  nextService: string;
};

const NEXT_SERVICE = "Sunrise Service · Sunday at 7:30 AM";

// WebRTC signaling (offer/answer) used to be module-level variables in the
// Express process. On serverless the offer posted by the broadcaster and the
// answer posted by a viewer would land on different instances, so the state
// is kept in Postgres (app_kv) instead.
type LiveRecord = {
  offer: LiveSession | null;
  answer: LiveSignal | null;
  title: string | null;
  startedAt: number | null;
};

export type LiveViewerSignal = {
  sessionId: string;
  viewerId: string;
  type: string;
  sdp: string;
};

type LiveViewerRecord = {
  sessionId: string;
  viewerId: string;
  offer: Pick<LiveSignal, "type" | "sdp">;
  answer: Pick<LiveSignal, "type" | "sdp"> | null;
  createdAt: number;
};

const KEY = "live";
// A broadcast that was never explicitly stopped (browser closed, etc.) stops
// counting as "live" after this long.
const STALE_AFTER_MS = 12 * 60 * 60 * 1000;
const VIEWER_SIGNAL_TTL_MS = 5 * 60 * 1000;
const DEFAULT_ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
];

const EMPTY: LiveRecord = { offer: null, answer: null, title: null, startedAt: null };

function viewerPrefix(sessionId: string) {
  return `live:viewers:${sessionId}:`;
}

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

export function getLiveIceServers() {
  const urls = process.env.LIVE_TURN_URLS?.split(",").map((url) => url.trim()).filter(Boolean) ?? [];
  if (urls.length === 0) return DEFAULT_ICE_SERVERS;

  const username = process.env.LIVE_TURN_USERNAME;
  const credential = process.env.LIVE_TURN_CREDENTIAL;
  if (!username || !credential) {
    throw new ConfigError("LIVE_TURN_URLS requires LIVE_TURN_USERNAME and LIVE_TURN_CREDENTIAL.");
  }

  return [
    ...DEFAULT_ICE_SERVERS,
    { urls, username, credential },
  ];
}

export async function publishOffer(offer: LiveSession, title: string) {
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

export async function publishViewerOffer(signal: LiveViewerSignal) {
  const record = await read();
  if (record.offer?.sessionId !== signal.sessionId) return false;
  const viewer: LiveViewerRecord = {
    sessionId: signal.sessionId,
    viewerId: signal.viewerId,
    offer: { type: signal.type, sdp: signal.sdp },
    answer: null,
    createdAt: Date.now(),
  };
  await kvSet(`${viewerPrefix(signal.sessionId)}${signal.viewerId}`, viewer);
  return true;
}

export async function getPendingViewerOffers(sessionId: string) {
  const record = await read();
  if (record.offer?.sessionId !== sessionId) return [];
  const viewers = await kvGetByPrefix<LiveViewerRecord>(viewerPrefix(sessionId));
  return viewers
    .filter((viewer) => !viewer.answer && Date.now() - viewer.createdAt < VIEWER_SIGNAL_TTL_MS)
    .map(({ viewerId, offer }) => ({ sessionId, viewerId, ...offer }));
}

export async function getViewerAnswer(sessionId: string, viewerId: string) {
  const record = await read();
  if (record.offer?.sessionId !== sessionId) return null;
  const [viewer] = await kvGetByPrefix<LiveViewerRecord>(`${viewerPrefix(sessionId)}${viewerId}`);
  return viewer?.sessionId === sessionId ? viewer.answer : null;
}

export async function publishViewerAnswer(signal: LiveViewerSignal) {
  const record = await read();
  if (record.offer?.sessionId !== signal.sessionId) return false;
  const key = `${viewerPrefix(signal.sessionId)}${signal.viewerId}`;
  const [viewer] = await kvGetByPrefix<LiveViewerRecord>(key);
  if (!viewer || viewer.sessionId !== signal.sessionId) return false;
  await kvSet(key, {
    ...viewer,
    answer: { type: signal.type, sdp: signal.sdp },
  } satisfies LiveViewerRecord);
  return true;
}

export async function stopLive(sessionId: string) {
  const record = await read();
  if (record.offer?.sessionId !== sessionId) return false;
  await kvDeleteByPrefix(viewerPrefix(sessionId));
  await kvSet(KEY, EMPTY);
  return true;
}
