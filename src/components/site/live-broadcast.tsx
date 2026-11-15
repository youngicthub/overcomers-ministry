'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Check,
  Copy,
  Loader2,
  LogOut,
  Play,
  Radio,
  RefreshCw,
  Share2,
  ShieldCheck,
  Square,
  SwitchCamera,
  Video,
} from 'lucide-react';
import {
  qk,
  adminLogout,
  getLiveIceServers,
  getLiveOffer,
  getLiveViewerAnswer,
  getLiveViewerOffers,
  submitLiveViewerAnswer,
  submitLiveViewerOffer,
  updateLiveMessage,
  useGetLiveStatus,
  usePublishLiveOffer,
  useStopLiveSession,
} from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

async function waitForIceGathering(
  peer: RTCPeerConnection,
  candidateType: 'srflx' | 'relay',
): Promise<RTCSessionDescriptionInit> {
  if (peer.iceGatheringState === 'complete' && peer.localDescription) {
    return peer.localDescription;
  }

  await new Promise<void>((resolve) => {
    const cleanup = () => {
      window.clearTimeout(timeout);
      peer.removeEventListener('icegatheringstatechange', checkState);
      peer.removeEventListener('icecandidate', checkCandidate);
    };
    const checkState = () => {
      if (peer.iceGatheringState === 'complete') {
        cleanup();
        resolve();
      }
    };
    const checkCandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate?.type === candidateType) {
        cleanup();
        resolve();
      }
    };
    const timeout = window.setTimeout(() => {
      cleanup();
      resolve();
    }, 8000);
    peer.addEventListener('icegatheringstatechange', checkState);
    peer.addEventListener('icecandidate', checkCandidate);
    checkState();
  });

  if (!peer.localDescription) {
    throw new Error('The browser could not finish preparing the live connection.');
  }
  return peer.localDescription;
}

function hasTurnServer(iceServers: RTCIceServer[]): boolean {
  return iceServers.some((server) => {
    const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
    return urls.some((url) => url.startsWith('turn:') || url.startsWith('turns:'));
  });
}

function preferredCandidateType(iceServers: RTCIceServer[]): 'srflx' | 'relay' {
  return hasTurnServer(iceServers) ? 'relay' : 'srflx';
}

function BroadcastHeader({
  isLive,
  onLogout,
  loggingOut,
}: {
  isLive: boolean;
  onLogout: () => void;
  loggingOut: boolean;
}) {
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
      <div className="flex items-center gap-2 self-start sm:self-auto">
        <Link href="/admin/dashboard" className="rounded-full border border-primary/20 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-primary hover:bg-muted">Dashboard</Link>
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="inline-flex items-center gap-2 rounded-full border border-primary/20 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-primary hover:bg-muted disabled:opacity-60"
        >
          {loggingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
          {loggingOut ? 'Logging out' : 'Log out'}
        </button>
      </div>
    </div>
  );
}

function MediaAdminStudio() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const viewerPeersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceServersRef = useRef<RTCIceServer[]>([]);
  const viewerPollRef = useRef<number | null>(null);
  const processingViewersRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [switchingCamera, setSwitchingCamera] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [title, setTitle] = useState('Sunday Celebration Service');
  const [messageDraft, setMessageDraft] = useState('');
  const [savingMessage, setSavingMessage] = useState(false);
  const [messageNotice, setMessageNotice] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('/live');
  const [loggingOut, setLoggingOut] = useState(false);
  const queryClient = useQueryClient();
  const publishOffer = usePublishLiveOffer();
  const stopSession = useStopLiveSession();
  const status = useGetLiveStatus({ refetchInterval: 5000 });

  const refreshCameras = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    setCameras(devices.filter((device) => device.kind === 'videoinput'));
  };

  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const updateCameras = () => {
      void refreshCameras().catch((cameraError: unknown) => {
        setError(cameraError instanceof Error ? cameraError.message : 'Could not list available cameras.');
      });
    };
    updateCameras();
    navigator.mediaDevices.addEventListener('devicechange', updateCameras);
    return () => navigator.mediaDevices.removeEventListener('devicechange', updateCameras);
  }, []);

  useEffect(() => {
    setShareUrl(`${window.location.origin}/live`);
  }, []);

  const openCamera = async () => {
    setError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not available in this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          ...(selectedCameraId ? { deviceId: { exact: selectedCameraId } } : {}),
          facingMode: selectedCameraId ? undefined : { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });
      streamRef.current = stream;
      const actualFacingMode = stream.getVideoTracks()[0]?.getSettings().facingMode;
      if (actualFacingMode === 'user' || actualFacingMode === 'environment') {
        setFacingMode(actualFacingMode);
      }
      void refreshCameras().catch((cameraError: unknown) => {
        setError(cameraError instanceof Error ? cameraError.message : 'Could not list available cameras.');
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
      setNotice('Camera and microphone are ready.');
    } catch (cameraError) {
      void refreshCameras().catch((refreshError: unknown) => {
        setError(refreshError instanceof Error ? refreshError.message : 'Could not list available cameras.');
      });
      const name = cameraError instanceof Error ? cameraError.name : '';
      setError(name === 'NotReadableError'
        ? 'The selected camera is already in use. Close the other app using it or choose another camera below.'
        : name === 'NotFoundError'
          ? 'No camera was found. Connect a camera or choose an available device.'
          : cameraError instanceof Error ? cameraError.message : 'Camera access was denied.');
    }
  };

  const flipCamera = async () => {
    const stream = streamRef.current;
    const currentTrack = stream?.getVideoTracks()[0];
    if (!stream || !currentTrack || switchingCamera) return;

    const nextFacingMode = facingMode === 'user' ? 'environment' : 'user';
    let replacementStream: MediaStream | null = null;
    setSwitchingCamera(true);
    setError('');
    setNotice('');
    try {
      replacementStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: nextFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      const replacementTrack = replacementStream.getVideoTracks()[0];
      if (!replacementTrack) throw new Error('The other camera did not provide a video track.');

      const videoSenders = Array.from(viewerPeersRef.current.values())
        .flatMap((peer) => peer.getSenders())
        .filter((sender) => sender.track?.kind === 'video');
      try {
        await Promise.all(videoSenders.map((sender) => sender.replaceTrack(replacementTrack)));
      } catch (replaceError) {
        await Promise.allSettled(videoSenders.map((sender) => sender.replaceTrack(currentTrack)));
        throw replaceError;
      }

      stream.removeTrack(currentTrack);
      stream.addTrack(replacementTrack);
      currentTrack.stop();
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        void videoRef.current.play().catch(() => {
          setNotice('Camera switched. Tap the preview if it does not appear.');
        });
      }
      const actualFacingMode = replacementTrack.getSettings().facingMode;
      setFacingMode(actualFacingMode === 'user' || actualFacingMode === 'environment'
        ? actualFacingMode
        : nextFacingMode);
      const deviceId = replacementTrack.getSettings().deviceId;
      if (deviceId) setSelectedCameraId(deviceId);
      setNotice(`Switched to the ${nextFacingMode === 'environment' ? 'rear' : 'front'} camera.`);
      await refreshCameras().catch((refreshError: unknown) => {
        setError(refreshError instanceof Error ? refreshError.message : 'Camera switched, but available cameras could not be refreshed.');
      });
    } catch (cameraError) {
      replacementStream?.getTracks().forEach((track) => track.stop());
      setError(cameraError instanceof Error
        ? cameraError.message
        : 'Could not switch cameras. Check that the other camera is available.');
    } finally {
      setSwitchingCamera(false);
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
      if (!stream) return;

      const iceConfiguration = await getLiveIceServers();
      iceServersRef.current = iceConfiguration.iceServers;
      const sessionId = crypto.randomUUID();
      sessionIdRef.current = sessionId;
      await publishOffer.mutateAsync({
        sessionId,
        title: title.trim() || 'Live from Overcomers',
      });
      setBroadcasting(true);
      setNotice(iceConfiguration.warning
        ? `You are live, but ${iceConfiguration.warning}`
        : 'You are live. Keep this window open while you broadcast.');
      await queryClient.invalidateQueries({ queryKey: qk.liveStatus });

      viewerPollRef.current = window.setInterval(() => {
        if (processingViewersRef.current) return;
        processingViewersRef.current = true;
        void getLiveViewerOffers(sessionId)
          .then(async (offers) => {
            for (const viewerOffer of offers) {
              if (viewerPeersRef.current.has(viewerOffer.viewerId)) continue;
              const viewerPeer = new RTCPeerConnection({ iceServers: iceServersRef.current });
              viewerPeersRef.current.set(viewerOffer.viewerId, viewerPeer);
              viewerPeer.onconnectionstatechange = () => {
                if (viewerPeer.connectionState === 'failed' || viewerPeer.connectionState === 'closed') {
                  viewerPeersRef.current.delete(viewerOffer.viewerId);
                  viewerPeer.close();
                }
              };
              try {
                await viewerPeer.setRemoteDescription({ type: viewerOffer.type as RTCSdpType, sdp: viewerOffer.sdp });
                stream.getTracks().forEach((track) => viewerPeer.addTrack(track, stream));
                const answer = await viewerPeer.createAnswer();
                await viewerPeer.setLocalDescription(answer);
                const localDescription = await waitForIceGathering(
                  viewerPeer,
                  preferredCandidateType(iceServersRef.current),
                );
                if (!localDescription.type || !localDescription.sdp) {
                  throw new Error('Could not prepare the viewer connection.');
                }
                await submitLiveViewerAnswer({
                  sessionId,
                  viewerId: viewerOffer.viewerId,
                  type: localDescription.type,
                  sdp: localDescription.sdp,
                });
                setNotice('A viewer has connected to the live service.');
              } catch (viewerError) {
                viewerPeer.close();
                viewerPeersRef.current.delete(viewerOffer.viewerId);
                setError(viewerError instanceof Error
                  ? `A viewer could not connect: ${viewerError.message}`
                  : 'A viewer could not connect to the live service.');
              }
            }
          })
          .catch((pollError: unknown) => {
            setError(pollError instanceof Error ? pollError.message : 'Could not check for viewers.');
          })
          .finally(() => {
            processingViewersRef.current = false;
          });
      }, 1000);
    } catch (broadcastError) {
      setError(broadcastError instanceof Error ? broadcastError.message : 'The broadcast could not start.');
    }
  };

  const saveLiveMessage = async (message: string) => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;
    setSavingMessage(true);
    setError('');
    setMessageNotice('');
    try {
      await updateLiveMessage({ sessionId, message });
      setMessageNotice(message ? 'Message is now visible to viewers.' : 'On-screen message cleared.');
      await queryClient.invalidateQueries({ queryKey: qk.liveStatus });
    } catch (messageError) {
      setError(messageError instanceof Error ? messageError.message : 'Could not update the on-screen message.');
    } finally {
      setSavingMessage(false);
    }
  };

  const stopBroadcast = async () => {
    const sessionId = sessionIdRef.current;
    if (viewerPollRef.current) window.clearInterval(viewerPollRef.current);
    viewerPeersRef.current.forEach((peer) => peer.close());
    viewerPeersRef.current.clear();
    if (sessionId) {
      await stopSession.mutateAsync({ sessionId });
    }
    sessionIdRef.current = null;
    setBroadcasting(false);
    setNotice('The broadcast has ended.');
    await queryClient.invalidateQueries({ queryKey: qk.liveStatus });
  };

  const logout = async () => {
    setLoggingOut(true);
    setError('');
    try {
      if (sessionIdRef.current) await stopBroadcast();
      await adminLogout();
      router.replace('/admin/login');
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : 'Could not log out. Please try again.');
      setLoggingOut(false);
    }
  };

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
    if (viewerPollRef.current) window.clearInterval(viewerPollRef.current);
    viewerPeersRef.current.forEach((peer) => peer.close());
    viewerPeersRef.current.clear();
    stopLocalMedia();
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-5 py-14 sm:py-20 lg:px-8">
      <BroadcastHeader
        isLive={broadcasting || Boolean(status.data?.isLive)}
        onLogout={() => void logout()}
        loggingOut={loggingOut}
      />
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
            {cameras.length > 0 && (
              <label className="block text-sm font-semibold text-primary-foreground">
                Camera
                <select
                  value={selectedCameraId}
                  onChange={(event) => setSelectedCameraId(event.target.value)}
                  disabled={cameraReady || broadcasting}
                  className="mt-2 w-full rounded-xl border border-primary-foreground/15 bg-primary px-4 py-3 text-sm text-primary-foreground outline-none focus:border-secondary disabled:opacity-60"
                >
                  <option value="">Default camera</option>
                  {cameras.map((camera, index) => (
                    <option key={camera.deviceId} value={camera.deviceId}>
                      {camera.label || `Camera ${index + 1}`}
                    </option>
                  ))}
                </select>
              </label>
            )}
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
              {cameraReady && (
                <button
                  type="button"
                  onClick={() => void flipCamera()}
                  disabled={switchingCamera}
                  className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {switchingCamera ? <Loader2 className="animate-spin" size={16} /> : <SwitchCamera size={16} />}
                  {switchingCamera ? 'Switching camera…' : `Flip to ${facingMode === 'user' ? 'rear' : 'front'} camera`}
                </button>
              )}
            </div>
            <div className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 p-5">
              <label htmlFor="live-message" className="block text-sm font-semibold text-primary-foreground">
                On-screen message or topic
                <textarea
                  id="live-message"
                  value={messageDraft}
                  onChange={(event) => {
                    setMessageDraft(event.target.value);
                    setMessageNotice('');
                  }}
                  maxLength={180}
                  rows={2}
                  disabled={!broadcasting || savingMessage}
                  placeholder="Share a topic, scripture, or announcement with viewers"
                  className="mt-2 w-full resize-y rounded-xl border border-primary-foreground/15 bg-primary-foreground/10 px-4 py-3 text-sm text-primary-foreground outline-none placeholder:text-primary-foreground/40 focus:border-secondary disabled:opacity-60"
                />
              </label>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void saveLiveMessage(messageDraft.trim())}
                  disabled={!broadcasting || savingMessage || !messageDraft.trim()}
                  className="rounded-full bg-secondary px-4 py-2.5 text-xs font-bold text-primary disabled:opacity-50"
                >
                  {savingMessage ? 'Updating…' : 'Show on stream'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMessageDraft('');
                    void saveLiveMessage('');
                  }}
                  disabled={!broadcasting || savingMessage || !status.data?.message}
                  className="rounded-full border border-primary-foreground/25 px-4 py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                >
                  Clear message
                </button>
                <span className="text-xs text-primary-foreground/60">{messageDraft.length}/180</span>
              </div>
              {messageNotice && <p className="mt-3 text-sm text-secondary" role="status">{messageNotice}</p>}
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
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const [connection, setConnection] = useState<'idle' | 'connecting' | 'connected' | 'waiting' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState('');
  const [muted, setMuted] = useState(true);
  const [retry, setRetry] = useState(0);
  const status = useGetLiveStatus({ refetchInterval: 5000 });

  useEffect(() => {
    let cancelled = false;
    let peer: RTCPeerConnection | null = null;
    let answerPoll: number | null = null;
    let remoteStream: MediaStream | null = null;
    const connect = async () => {
      if (!status.data?.isLive) {
        setConnection('idle');
        return;
      }
      setConnection('connecting');
      setConnectionError('');
      try {
        const [offer, iceConfiguration] = await Promise.all([getLiveOffer(), getLiveIceServers()]);
        if (!offer?.sessionId) {
          setConnection('waiting');
          return;
        }
        const iceServers = iceConfiguration.iceServers;
        const viewerId = crypto.randomUUID();
        peer = new RTCPeerConnection({ iceServers });
        peer.addTransceiver('video', { direction: 'recvonly' });
        peer.addTransceiver('audio', { direction: 'recvonly' });
        peer.ontrack = (event) => {
          remoteStream = event.streams[0] ?? remoteStream ?? new MediaStream();
          if (!event.streams[0] && !remoteStream.getTracks().some((track) => track.id === event.track.id)) {
            remoteStream.addTrack(event.track);
          }
          remoteStreamRef.current = remoteStream;
          if (videoRef.current) {
            videoRef.current.srcObject = remoteStream;
            void videoRef.current.play().catch(() => {
              if (!cancelled) setConnectionError('Tap the video to start playback.');
            });
          }
          setConnection('connected');
        };
        peer.onconnectionstatechange = () => {
          if (!cancelled && peer?.connectionState === 'failed') {
            setConnectionError(hasTurnServer(iceServers)
              ? 'The phone could not connect through the network. Check its internet connection and try again.'
              : iceConfiguration.warning
                ? iceConfiguration.warning
                : 'This phone network needs a TURN relay. Ask the broadcast administrator to configure TURN in Vercel.');
            setConnection('error');
          }
        };
        const viewerOffer = await peer.createOffer();
        await peer.setLocalDescription(viewerOffer);
        const localDescription = await waitForIceGathering(peer, preferredCandidateType(iceServers));
        if (!localDescription.type || !localDescription.sdp) throw new Error('Could not prepare the viewer connection.');
        await submitLiveViewerOffer({
          sessionId: offer.sessionId,
          viewerId,
          type: localDescription.type,
          sdp: localDescription.sdp,
        });
        const pollAnswer = async () => {
          const answer = await getLiveViewerAnswer(offer.sessionId, viewerId);
          if (cancelled || !answer?.type || !answer.sdp || !peer) return false;
          await peer.setRemoteDescription({ type: answer.type as RTCSdpType, sdp: answer.sdp });
          return true;
        };
        const answered = await pollAnswer();
        if (!answered && !cancelled) {
          answerPoll = window.setInterval(() => {
            void pollAnswer().then((received) => {
              if (received && answerPoll) window.clearInterval(answerPoll);
            }).catch(() => {
              if (!cancelled) setConnection('error');
              if (answerPoll) window.clearInterval(answerPoll);
            });
          }, 1000);
        }
      } catch (error) {
        if (!cancelled) {
          setConnectionError(error instanceof Error ? error.message : 'Please check your connection and try again.');
          setConnection('error');
        }
      }
    };
    void connect();
    return () => {
      cancelled = true;
      if (answerPoll) window.clearInterval(answerPoll);
      peer?.close();
      if (videoRef.current) videoRef.current.srcObject = null;
      remoteStreamRef.current = null;
    };
  }, [retry, status.data?.isLive]);

  return (
    <div className="overflow-hidden rounded-[2rem] bg-primary shadow-xl">
      <div className="relative aspect-video overflow-hidden bg-[#0b1027]">
        <video ref={videoRef} autoPlay muted={muted} playsInline controls className={`h-full w-full object-contain ${connection === 'connected' ? 'opacity-100' : 'opacity-0'}`} aria-label="Live service video" />
        {connection === 'connected' && status.data?.message && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-5 pb-5 pt-12 text-center sm:px-8 sm:pb-7">
            <p className="mx-auto max-w-3xl whitespace-pre-wrap break-words text-base font-semibold leading-relaxed text-white drop-shadow sm:text-xl">
              {status.data.message}
            </p>
          </div>
        )}
        {connection !== 'connected' && (
          <div className="absolute inset-0 grid place-items-center overflow-y-auto px-5 py-4 text-center text-primary-foreground sm:px-6">
            <div className="max-w-lg">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-secondary text-secondary">
                {connection === 'connecting' ? <Loader2 className="animate-spin" size={25} /> : <Radio size={25} />}
              </div>
              <p className="mt-4 font-display text-xl sm:mt-5 sm:text-2xl">
                {connection === 'waiting' ? 'Waiting for the service to connect' : connection === 'error' ? 'We could not connect to the live room' : 'Connecting to the live room'}
              </p>
              <p className="mt-2 text-sm leading-5 text-primary-foreground/60">
                {connection === 'error'
                  ? connectionError || 'Please check your connection and try again.'
                  : connection === 'waiting'
                    ? 'The live video will appear here when the broadcaster is ready.'
                    : 'The live video will appear here when the broadcaster is ready.'}
              </p>
              {connection === 'error' && (
                <button
                  type="button"
                  onClick={() => setRetry((attempt) => attempt + 1)}
                  className="mt-4 rounded-full bg-secondary px-5 py-2.5 text-sm font-bold text-primary sm:mt-5"
                >
                  Try connecting again
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center sm:p-8">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary"><span className={`h-2 w-2 rounded-full ${status.data?.isLive ? 'animate-pulse bg-accent' : 'bg-primary-foreground/30'}`} />{status.data?.isLive ? 'Live now' : 'Currently offline'}</span>
          <h2 className="mt-2 font-display text-2xl text-primary-foreground">{status.data?.title || 'Sunday worship at Overcomers'}</h2>
        </div>
        <div className="flex flex-wrap gap-4">
          {connection === 'connected' && (
            <button type="button" onClick={() => setMuted((isMuted) => !isMuted)} className="text-sm font-bold text-secondary">
              {muted ? 'Enable audio' : 'Mute audio'}
            </button>
          )}
          <Link href="/sermons" className="inline-flex items-center gap-2 text-sm font-bold text-secondary">Browse messages <Video size={15} /></Link>
        </div>
      </div>
    </div>
  );
}

export function LiveBroadcastPage() {
  return (
    <>
      <section className="bg-primary px-5 py-16 text-primary-foreground sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 flex items-center gap-3 text-secondary"><span className="gold-rule" /><span className="eyebrow">Live from Overcomers</span></div>
          <h1 className="max-w-3xl font-display text-4xl leading-[1.08] sm:text-6xl">The room is open when we gather.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-primary-foreground/70">Watch a live message or service from wherever you are.</p>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-5 py-16 sm:py-24 lg:px-8">
        <ViewerExperience />
      </section>
    </>
  );
}

export function LiveBroadcastStudioPage() {
  return <MediaAdminStudio />;
}