// Plain fetch + React Query wrappers for the Backend API. This replaces
// the old orval-generated `@workspace/api-client-react` package now that
// Frontend is a standalone app (no more shared workspace packages).
//
// Every request is same-origin relative ("/api/...") and goes through the
// Vite dev proxy (see vite.config.ts) in development, or is served behind
// the same host/reverse proxy as the Backend in production.
import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  const isEmpty = response.status === 204 || response.headers.get('content-length') === '0';
  const data = isEmpty ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const message = (data as { error?: string } | null)?.error || `Request failed (${response.status})`;
    throw new ApiError(response.status, message, data);
  }
  return data as T;
}

function get<T>(url: string): Promise<T> {
  return request<T>(url, { method: 'GET' });
}

function withQuery(url: string, params?: Record<string, string | undefined>) {
  if (!params) return url;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `${url}?${query}` : url;
}

function mutationRequest<T>(method: string, url: string, body?: unknown): Promise<T> {
  return request<T>(url, { method, body: body !== undefined ? JSON.stringify(body) : undefined });
}

// ---- Types ----

export type Devotional = { verse: string; reference: string; reflection: string; prayerPoint: string; date: string };
export type Ministry = { id: string; name: string; description: string; accent: string };
export type ChurchEvent = { id: number; title: string; description: string; location: string; date: string; time: string; category: string };
export type Sermon = { id: number; title: string; speaker: string; description: string; series: string; date: string; duration: string; videoUrl: string | null; audioUrl: string | null };
export type Article = { id: number; title: string; excerpt: string; content: string; category: string; author: string; coverImageUrl: string | null; date: string; readTime: string; published?: boolean };
export type Video = { id: number; title: string; description: string | null; category: string | null; sourceUrl: string; embedUrl: string; thumbnailUrl: string | null; isDirectFile: boolean; createdAt: string; updatedAt: string };
export type Testimony = { id: number; name: string; content: string; location: string };
export type LiveStatus = { isLive: boolean; platform: string | null; title: string | null; embedUrl: string | null; nextService: string };
export type HomeContent = { devotional: Devotional; events: ChurchEvent[]; sermons: Sermon[]; article: Article | null; videos: Video[]; live: LiveStatus };
export type HealthStatus = { status: string };

// ---- Query keys ----

export const qk = {
  health: ['health'] as const,
  home: ['home'] as const,
  ministries: ['ministries'] as const,
  events: ['events'] as const,
  sermons: (search?: string) => ['sermons', search ?? ''] as const,
  articles: (search?: string, category?: string) => ['articles', search ?? '', category ?? ''] as const,
  article: (id: number) => ['articles', id] as const,
  videos: (search?: string, category?: string) => ['videos', search ?? '', category ?? ''] as const,
  devotionalToday: ['devotional-today'] as const,
  testimonies: ['testimonies'] as const,
  liveStatus: ['live-status'] as const,
};

// ---- Public queries ----

export function useHealthCheck(options?: Partial<UseQueryOptions<HealthStatus>>) {
  return useQuery({ queryKey: qk.health, queryFn: () => get<HealthStatus>('/api/healthz'), ...options });
}

export function useGetHomeContent(options?: Partial<UseQueryOptions<HomeContent>>) {
  return useQuery({ queryKey: qk.home, queryFn: () => get<HomeContent>('/api/home'), ...options });
}

export function useListMinistries(options?: Partial<UseQueryOptions<Ministry[]>>) {
  return useQuery({ queryKey: qk.ministries, queryFn: () => get<Ministry[]>('/api/ministries'), ...options });
}

export function useListEvents(options?: Partial<UseQueryOptions<ChurchEvent[]>>) {
  return useQuery({ queryKey: qk.events, queryFn: () => get<ChurchEvent[]>('/api/events'), ...options });
}

export function useListSermons(search?: string, options?: Partial<UseQueryOptions<Sermon[]>>) {
  return useQuery({
    queryKey: qk.sermons(search),
    queryFn: () => get<Sermon[]>(withQuery('/api/sermons', { search })),
    ...options,
  });
}

export function useListArticles(search?: string, category?: string, options?: Partial<UseQueryOptions<Article[]>>) {
  return useQuery({
    queryKey: qk.articles(search, category),
    queryFn: () => get<Article[]>(withQuery('/api/articles', { search, category })),
    ...options,
  });
}

export function useGetArticle(id: number, options?: Partial<UseQueryOptions<Article>>) {
  return useQuery({ queryKey: qk.article(id), queryFn: () => get<Article>(`/api/articles/${id}`), ...options });
}

export function useListVideos(search?: string, category?: string, options?: Partial<UseQueryOptions<Video[]>>) {
  return useQuery({
    queryKey: qk.videos(search, category),
    queryFn: () => get<Video[]>(withQuery('/api/videos', { search, category })),
    ...options,
  });
}

export function useGetTodayDevotional(options?: Partial<UseQueryOptions<Devotional>>) {
  return useQuery({ queryKey: qk.devotionalToday, queryFn: () => get<Devotional>('/api/devotionals/today'), ...options });
}

export function useListTestimonies(options?: Partial<UseQueryOptions<Testimony[]>>) {
  return useQuery({ queryKey: qk.testimonies, queryFn: () => get<Testimony[]>('/api/testimonies'), ...options });
}

export function useGetLiveStatus(options?: Partial<UseQueryOptions<LiveStatus>>) {
  return useQuery({ queryKey: qk.liveStatus, queryFn: () => get<LiveStatus>('/api/live'), ...options });
}

// ---- Public mutations (forms) ----

type Receipt = { id: string; message: string };

export function useCreatePrayerRequest(options?: UseMutationOptions<Receipt, ApiError, { name?: string; request: string; anonymous: boolean }>) {
  return useMutation({ mutationFn: (data) => mutationRequest<Receipt>('POST', '/api/prayers', data), ...options });
}

export function useRegisterMember(options?: UseMutationOptions<Receipt, ApiError, Record<string, unknown>>) {
  return useMutation({ mutationFn: (data) => mutationRequest<Receipt>('POST', '/api/members', data), ...options });
}

export function useCreateConsultation(options?: UseMutationOptions<Receipt, ApiError, Record<string, unknown>>) {
  return useMutation({ mutationFn: (data) => mutationRequest<Receipt>('POST', '/api/consultations', data), ...options });
}

export function useCreateContactMessage(options?: UseMutationOptions<Receipt, ApiError, Record<string, unknown>>) {
  return useMutation({ mutationFn: (data) => mutationRequest<Receipt>('POST', '/api/contacts', data), ...options });
}

// ---- Live signaling (WebRTC broadcast studio + viewer) ----

export type LiveSignal = { sessionId: string; type: string; sdp: string };

export function getLiveOffer() {
  return get<LiveSignal | null>('/api/live/offer');
}

export function getLiveAnswer(sessionId: string) {
  return get<LiveSignal | null>(`/api/live/answer?sessionId=${encodeURIComponent(sessionId)}`);
}

export function submitLiveAnswer(data: LiveSignal) {
  return mutationRequest('POST', '/api/live/answer', data);
}

export function usePublishLiveOffer(options?: UseMutationOptions<{ sessionId: string; title: string; isLive: boolean }, ApiError, LiveSignal & { title: string }>) {
  return useMutation({ mutationFn: (data) => mutationRequest('POST', '/api/live/offer', data), ...options });
}

export function useStopLiveSession(options?: UseMutationOptions<LiveStatus, ApiError, { sessionId: string }>) {
  return useMutation({ mutationFn: (data) => mutationRequest<LiveStatus>('POST', '/api/live/stop', data), ...options });
}

// ---- Admin: auth ----

export type Admin = { id: string; name: string; createdAt: string };
export type AdminSession = { authenticated: boolean; admin: Admin };

export function signupAdmin(data: { accessToken: string; name: string; password: string }) {
  return mutationRequest<{ admin: Admin; message: string }>('POST', '/api/admin/signup', data);
}

export function loginAdmin(data: { adminId: string; password: string }) {
  return mutationRequest<AdminSession>('POST', '/api/admin/login', data);
}

export function getAdminSession() {
  return get<AdminSession>('/api/admin/session');
}

export function adminLogout() {
  return mutationRequest('POST', '/api/admin/logout');
}

// ---- Admin: content management ----

export function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  return request<T>(url, init);
}
