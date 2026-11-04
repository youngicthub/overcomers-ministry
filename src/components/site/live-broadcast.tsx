'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Check,
  Copy,
  Loader2,
  LogIn,
  LogOut,
  Play,
  Radio,
  RefreshCw,
  Share2,
  ShieldCheck,
  Square,
  Video,
} from 'lucide-react';
import {
  qk,
  getLiveAnswer,
  getLiveOffer,
  submitLiveAnswer,
  useGetLiveStatus,
  usePublishLiveOffer,
  useStopLiveSession,
} from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

const iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];

async function waitForIceGathering(
  peer: RTCPeerConnection,
): Promise<RTCSessionDescriptionInit> {
  if (peer.iceGatheringState === 'complete' && peer.localDescription) {
    return peer.localDescription;
  }

  await new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, 4000);
    const checkState = () => {
      if (peer.iceGatheringState === 'complete') {
        window.clearTimeout(timeout);
        peer.removeEventListener('icegatheringstatechange', checkState);
        resolve();
      }
    };
    peer.addEventListener('icegatheringstatechange', checkState);
  });

  if (!peer.localDescription) {
    throw new Error('The browser could not finish preparing the live connection.');
  }
  return peer.localDescription;
}

function BroadcastHeader({ isLive }: { isLive: boolean }) {
  return (
    <div className="flex flex-col justify-between gap-5 border-b border-border pb-7 sm:flex-row sm:items-end">
      <div>
        <div className="mb-4 flex items-center gap-3 text-accent">
          <span className="gold-rule" />
          <span className="eyebrow">Media Admin Studio</span>
        </div>
        <h1 className="font-display text-4xl leading-tight text-primary sm:text-5xl">
          Bring the service to the room.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
          Use your camera and microphone to broadcast a message or service. Only an
          authenticated Media Admin can start or stop a broadcast.
        </p>
      </div>
      <span className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-2 text-xs font-bold uppercase tracking-wider ${isLive ? 'bg-secondary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
        <span className={`h-2 w-2 rounded-full ${isLive ? 'animate-pulse bg-accent' : 'bg-muted-foreground/40'}`} />
        {isLive ? 'Live now' : 'Offline'}
      </span>
      <Link href="/admin/dashboard" className="self-start rounded-full border border-primary/20 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-primary hover:bg-muted sm:self-auto">Dashboard</Link>
    </div>
  );
}

function MediaAdminStudio() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const answerPollRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [title, setTitle] = useState('Sunday Celebration Service');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const queryClient = useQueryClient();
  const publishOffer = usePublishLiveOffer();
  const stopSession = useStopLiveSession();
  const status = useGetLiveStatus({ refetchInterval: 5000 });

  const openCamera = async () => {
    setError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not available in this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
      setNotice('Camera and microphone are ready.');
    } catch (cameraError) {
      setError(cameraError instanceof Error ? cameraError.message : 'Camera access was denied.');
    }
  };

  const stopLocalMedia = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
  };

  const startBroadcast = async () => {
    setError('');
    setNotice('');
    try {
      let stream = streamRef.current;
      if (!stream) {
        await openCamera();
        stream = streamRef.current;
      }
      if (!stream) throw new Error('Camera access is required before going live.');

      const peer = new RTCPeerConnection({ iceServers });
      peerRef.current = peer;
      stream.getTracks().forEach((track) => peer.addTrack(track, stream as MediaStream));
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      const localDescription = await waitForIceGathering(peer);
      if (!localDescription.sdp || !localDescription.type) {
        throw new Error('The browser could not prepare the live connection.');
      }

      const sessionId = crypto.randomUUID();
      sessionIdRef.current = sessionId;
      await publishOffer.mutateAsync({
        sessionId,
        title: title.trim() || 'Live from Overcomers',
        type: localDescription.type,
        sdp: localDescription.sdp,
      });
      setBroadcasting(true);
      setNotice('You are live. Keep this window open while you broadcast.');
      await queryClient.invalidateQueries({ queryKey: qk.liveStatus });

      answerPollRef.current = window.setInterval(async () => {
        if (peer.currentRemoteDescription) return;
        const answer = await getLiveAnswer(sessionId).catch(() => null);
        if (answer?.type && answer.sdp) {
          await peer.setRemoteDescription({ type: answer.type as RTCSdpType, sdp: answer.sdp });
          if (answerPollRef.current) window.clearInterval(answerPollRef.current);
          setNotice('A viewer has connected to the live service.');
        }
      }, 1000);
    } catch (broadcastError) {
      peerRef.current?.close();
      peerRef.current = null;
      setError(broadcastError instanceof Error ? broadcastError.message : 'The broadcast could not start.');
    }
  };

  const stopBroadcast = async () => {
    const sessionId = sessionIdRef.current;
    if (answerPollRef.current) window.clearInterval(answerPollRef.current);
    peerRef.current?.close();
    peerRef.current = null;
    if (sessionId) {
      await stopSession.mutateAsync({ sessionId });
    }
    sessionIdRef.current = null;
    setBroadcasting(false);
    setNotice('The broadcast has ended.');
    await queryClient.invalidateQueries({ queryKey: qk.liveStatus });
  };

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/live` : '/live';

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      setError('Could not copy the link — copy it manually instead.');
    }
  };

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(`We're live now — watch here: ${shareUrl}`)}`;

  useEffect(() => () => {
    if (answerPollRef.current) window.clearInterval(answerPollRef.current);
    peerRef.current?.close();
    stopLocalMedia();
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-5 py-14 sm:py-20 lg:px-8">
      <BroadcastHeader isLive={broadcasting || Boolean(status.data?.isLive)} />
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.25fr_.75fr]">
        <div className="overflow-hidden rounded-[2rem] bg-primary shadow-xl">
          <div className="relative aspect-video bg-[#0b1027]">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`h-full w-full object-cover ${cameraReady ? 'opacity-100' : 'opacity-0'}`}
              aria-label="Your camera preview"
            />
            {!cameraReady && (
              <div className="absolute inset-0 grid place-items-center px-6 text-center text-primary-foreground">
                <div>
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-secondary/60 text-secondary">
                    <Camera size={25} />
                  </div>
                  <p className="mt-5 font-display text-2xl">Camera preview</p>
                  <p className="mt-2 text-sm text-primary-foreground/60">
                    Allow camera and microphone access to preview your service.
                  </p>
                </div>
              </div>
            )}
            {broadcasting && (
              <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-2 text-xs font-bold text-white shadow-lg">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> LIVE
              </span>
            )}
          </div>
          <div className="grid gap-5 p-6 sm:p-8">
            <label className="block text-sm font-semibold text-primary-foreground">
              Broadcast title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={broadcasting}
                className="mt-2 w-full rounded-xl border border-primary-foreground/15 bg-primary-foreground/10 px-4 py-3 text-sm text-primary-foreground outline-none placeholder:text-primary-foreground/40 focus:border-secondary disabled:opacity-60"
                placeholder="e.g. Sunday Celebration Service"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              {!cameraReady ? (
                <button type="button" onClick={openCamera} className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-bold text-primary">
                  <Camera size={16} /> Allow camera access
                </button>
              ) : !broadcasting ? (
                <button type="button" onClick={startBroadcast} disabled={publishOffer.isPending} className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-bold text-primary disabled:opacity-60">
                  {publishOffer.isPending ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
                  Start live broadcast
                </button>
              ) : (
                <button type="button" onClick={stopBroadcast} disabled={stopSession.isPending} className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
                  {stopSession.isPending ? <Loader2 className="animate-spin" size={16} /> : <Square size={15} />}
                  End broadcast
                </button>
              )}
              {cameraReady && !broadcasting && (
                <button type="button" onClick={stopLocalMedia} className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 px-5 py-3 text-sm font-semibold text-primary-foreground">
                  <CameraOff size={16} /> Turn camera off
                </button>
              )}
            </div>
            {(notice || error) && (
              <div className={`flex items-start gap-3 text-sm ${error ? 'text-red-200' : 'text-primary-foreground/75'}`} role="status">
                {error ? <RefreshCw size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-secondary" />}
                <span>{error || notice}</span>
              </div>
            )}
            <div className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 p-5">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary"><Share2 size={14} /> Share with your congregation</p>
              <p className="mt-2 text-sm text-primary-foreground/70">Send this link so anyone can watch — it always shows the broadcast when one is live.</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <code className="flex-1 truncate rounded-lg bg-primary-foreground/10 px-3 py-2.5 text-xs text-primary-foreground/90">{shareUrl}</code>
                <button type="button" onClick={copyShareLink} data-testid="button-copy-live-link" className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2.5 text-xs font-bold text-primary">
                  {linkCopied ? <Check size={14} /> : <Copy size={14} />} {linkCopied ? 'Copied' : 'Copy link'}
                </button>
                <a href={whatsappShareUrl} target="_blank" rel="noopener noreferrer" data-testid="link-share-whatsapp" className="inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/25 px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:border-secondary hover:text-secondary">
                  Share on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
        <aside className="rounded-2xl border border-border bg-card p-7">
          <div className="flex items-center gap-3 text-accent">
            <ShieldCheck size={21} />
            <span className="eyebrow">Broadcast checklist</span>
          </div>
          <h2 className="mt-5 font-display text-3xl text-primary">Before you go live</h2>
          <ul className="mt-6 space-y-5 text-sm leading-6 text-muted-foreground">
            <li className="flex gap-3"><span className="font-display text-lg text-secondary">01</span><span>Use a stable internet connection and keep this tab open.</span></li>
            <li className="flex gap-3"><span className="font-display text-lg text-secondary">02</span><span>Check your frame, lighting, microphone, and the broadcast title.</span></li>
            <li className="flex gap-3"><span className="font-display text-lg text-secondary">03</span><span>Viewers can join from the public Watch Live page once you start.</span></li>
          </ul>
          <div className="mt-8 border-t border-border pt-6 text-xs leading-5 text-muted-foreground">
            Camera and microphone permissions are handled by your browser. The stream uses a direct WebRTC connection and is not recorded by this site.
          </div>
        </aside>
      </div>
    </section>
  );
}

function ViewerExperience() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [connection, setConnection] = useState<'idle' | 'connecting' | 'connected' | 'waiting' | 'error'>('idle');
  const status = useGetLiveStatus({ refetchInterval: 5000 });

  useEffect(() => {
    let cancelled = false;
    let peer: RTCPeerConnection | null = null;
    const connect = async () => {
      if (!status.data?.isLive) {
        setConnection('idle');
        return;
      }
      setConnection('connecting');
      try {
        const offer = await getLiveOffer();
        if (!offer?.sessionId || !offer.type || !offer.sdp) {
          setConnection('waiting');
          return;
        }
        peer = new RTCPeerConnection({ iceServers });
        peer.ontrack = (event) => {
          if (videoRef.current) videoRef.current.srcObject = event.streams[0];
          setConnection('connected');
        };
        await peer.setRemoteDescription({ type: offer.type as RTCSdpType, sdp: offer.sdp });
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        const localDescription = await waitForIceGathering(peer);
        if (!localDescription.type || !localDescription.sdp) throw new Error('Could not prepare the viewer connection.');
        await submitLiveAnswer({ sessionId: offer.sessionId, type: localDescription.type, sdp: localDescription.sdp });
        if (!cancelled && connection !== 'connected') setConnection('connecting');
      } catch {
        if (!cancelled) setConnection('error');
      }
    };
    void connect();
    return () => {
      cancelled = true;
      peer?.close();
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [status.data?.isLive]);

  return (
    <div className="overflow-hidden rounded-[2rem] bg-primary shadow-xl">
      <div className="relative aspect-video bg-[#0b1027]">
        <video ref={videoRef} autoPlay playsInline controls className={`h-full w-full object-contain ${connection === 'connected' ? 'opacity-100' : 'opacity-0'}`} aria-label="Live service video" />
        {connection !== 'connected' && (
          <div className="absolute inset-0 grid place-items-center px-6 text-center text-primary-foreground">
            <div>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-secondary text-secondary">
                {connection === 'connecting' ? <Loader2 className="animate-spin" size={25} /> : <Radio size={25} />}
              </div>
              <p className="mt-5 font-display text-2xl">
                {connection === 'waiting' ? 'Waiting for the service to connect' : connection === 'error' ? 'We could not connect to the live room' : 'Connecting to the live room'}
              </p>
              <p className="mt-2 text-sm text-primary-foreground/60">
                {connection === 'error' ? 'Please refresh and try again.' : 'The live video will appear here when the broadcaster is ready.'}
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center sm:p-8">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary"><span className={`h-2 w-2 rounded-full ${status.data?.isLive ? 'animate-pulse bg-accent' : 'bg-primary-foreground/30'}`} />{status.data?.isLive ? 'Live now' : 'Currently offline'}</span>
          <h2 className="mt-2 font-display text-2xl text-primary-foreground">{status.data?.title || 'Sunday worship at Overcomers'}</h2>
        </div>
        <Link href="/sermons" className="inline-flex items-center gap-2 text-sm font-bold text-secondary">Browse messages <Video size={15} /></Link>
      </div>
    </div>
  );
}

export function LiveBroadcastPage() {
  const [adminSession, setAdminSession] = useState<{ admin: { id: string; name: string } } | null>(null);

  useEffect(() => {
    let active = true;
    void fetch('/api/admin/session', { credentials: 'include' })
      .then(async (response) => response.ok ? response.json() as Promise<{ admin: { id: string; name: string } }> : null)
      .then((session) => { if (active) setAdminSession(session); })
      .catch(() => { if (active) setAdminSession(null); });
    return () => { active = false; };
  }, []);

  const isMediaAdmin = Boolean(adminSession);

  return (
    <>
      <section className="bg-primary px-5 py-16 text-primary-foreground sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 flex items-center gap-3 text-secondary"><span className="gold-rule" /><span className="eyebrow">Live from Overcomers</span></div>
          <h1 className="max-w-3xl font-display text-4xl leading-[1.08] sm:text-6xl">The room is open when we gather.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-primary-foreground/70">Join a live message or service from wherever you are, or sign in as a Media Admin to bring the room online.</p>
        </div>
      </section>
      {isMediaAdmin ? (
        <MediaAdminStudio />
      ) : (
        <section className="mx-auto max-w-5xl px-5 py-16 sm:py-24 lg:px-8">
          <ViewerExperience />
          <div className="mt-8 rounded-2xl border border-border bg-card p-7 text-center">
            <ShieldCheck className="mx-auto text-secondary" size={25} />
            <h2 className="mt-4 font-display text-2xl text-primary">Are you leading the broadcast?</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Use the admin access token and on-screen OTP to create or open an individual Media Admin account.</p>
            <Link href="/admin/login" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"><LogIn size={16} /> Sign in as Media Admin</Link>
          </div>
        </section>
      )}
    </>
  );
}