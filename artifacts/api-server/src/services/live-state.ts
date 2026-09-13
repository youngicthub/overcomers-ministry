export type LiveSignal = {
  sessionId: string;
  type: string;
  sdp: string;
};

export const liveStatus = {
  isLive: false,
  platform: null as string | null,
  title: null as string | null,
  embedUrl: null as string | null,
  nextService: "Sunday Celebration Service · Sunday at 8:00 AM",
};

let activeOffer: LiveSignal | null = null;
let activeAnswer: LiveSignal | null = null;

export function publishOffer(offer: LiveSignal, title: string) {
  activeOffer = offer;
  activeAnswer = null;
  liveStatus.isLive = true;
  liveStatus.platform = "WebRTC";
  liveStatus.title = title;
  liveStatus.embedUrl = null;
  return { sessionId: offer.sessionId, title, isLive: true };
}

export function getOffer() {
  return activeOffer;
}

export function getAnswer(sessionId: string) {
  if (activeOffer?.sessionId !== sessionId) return null;
  return activeAnswer;
}

export function publishAnswer(answer: LiveSignal) {
  if (activeOffer?.sessionId !== answer.sessionId) return false;
  activeAnswer = answer;
  return true;
}

export function stopLive(sessionId: string) {
  if (activeOffer?.sessionId !== sessionId) return false;
  activeOffer = null;
  activeAnswer = null;
  liveStatus.isLive = false;
  liveStatus.platform = null;
  liveStatus.title = null;
  liveStatus.embedUrl = null;
  return true;
}