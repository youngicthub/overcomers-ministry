import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  ArrowLeft,
  FileText,
  HandHeart,
  Loader2,
  Pencil,
  Plus,
  Radio,
  Trash2,
  Users,
  UsersRound,
  Video,
} from 'lucide-react';

type AdminSession = { admin: { id: string; name: string } };

type Sermon = {
  id: number;
  title: string;
  speaker: string;
  description: string;
  series: string;
  date: string;
  duration: string;
  videoUrl: string | null;
  audioUrl: string | null;
};

type PrayerRequest = {
  id: number;
  name: string | null;
  request: string;
  anonymous: boolean;
  createdAt: string;
};

type Member = {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  gender: string;
  occupation: string;
  address: string;
  birthday: string | null;
  prayerRequest: string | null;
  createdAt: string;
};

type Worker = { id: string; name: string; createdAt: string };

type Article = {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  coverImageUrl: string | null;
  published: boolean;
  createdAt: string;
};

type VideoItem = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  sourceUrl: string;
  thumbnailUrl: string | null;
  createdAt: string;
};

type Tab = 'sermons' | 'articles' | 'videos' | 'prayers' | 'members' | 'workers';

const emptySermonForm = {
  title: '',
  speaker: '',
  description: '',
  series: '',
  date: '',
  duration: '',
  videoUrl: '',
  audioUrl: '',
};

const emptyArticleForm = {
  title: '',
  excerpt: '',
  content: '',
  category: '',
  author: '',
  coverImageUrl: '',
  published: true,
};

const emptyVideoForm = {
  title: '',
  description: '',
  category: '',
  sourceUrl: '',
  thumbnailUrl: '',
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: 'include', ...init });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || 'Something went wrong. Please try again.');
  }
  return data as T;
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return value;
  }
}

function TabButton({ active, onClick, icon, label, count }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${active ? 'bg-primary text-primary-foreground' : 'border border-primary/20 text-primary hover:bg-muted'}`}
    >
      {icon} {label}
      {typeof count === 'number' && <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-primary-foreground/20' : 'bg-muted'}`}>{count}</span>}
    </button>
  );
}

function SermonForm({ initial, onCancel, onSave, saving }: { initial: typeof emptySermonForm; onCancel: () => void; onSave: (values: typeof emptySermonForm) => void; saving: boolean }) {
  const [values, setValues] = useState(initial);

  const set = (key: keyof typeof emptySermonForm) => (event: { target: { value: string } }) =>
    setValues((prev) => ({ ...prev, [key]: event.target.value }));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(values);
      }}
      className="grid gap-4 rounded-2xl border border-border bg-muted/40 p-6 sm:grid-cols-2"
    >
      <label className="block text-sm font-semibold text-primary">Title
        <input required value={values.title} onChange={set('title')} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
      </label>
      <label className="block text-sm font-semibold text-primary">Speaker
        <input required value={values.speaker} onChange={set('speaker')} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
      </label>
      <label className="block text-sm font-semibold text-primary sm:col-span-2">Description
        <textarea required rows={2} value={values.description} onChange={set('description')} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
      </label>
      <label className="block text-sm font-semibold text-primary">Series
        <input required value={values.series} onChange={set('series')} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
      </label>
      <label className="block text-sm font-semibold text-primary">Date
        <input required type="date" value={values.date} onChange={set('date')} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
      </label>
      <label className="block text-sm font-semibold text-primary">Duration
        <input required placeholder="e.g. 42 min" value={values.duration} onChange={set('duration')} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
      </label>
      <label className="block text-sm font-semibold text-primary">Video URL
        <input value={values.videoUrl} onChange={set('videoUrl')} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
      </label>
      <label className="block text-sm font-semibold text-primary sm:col-span-2">Audio URL <span className="font-normal text-muted-foreground">(optional)</span>
        <input value={values.audioUrl} onChange={set('audioUrl')} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
      </label>
      <div className="flex gap-3 sm:col-span-2">
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60">
          {saving && <Loader2 size={15} className="animate-spin" />} Save sermon
        </button>
        <button type="button" onClick={onCancel} className="rounded-full border border-primary/20 px-5 py-2.5 text-sm font-bold text-primary">Cancel</button>
      </div>
    </form>
  );
}

function SermonsPanel() {
  const [sermons, setSermons] = useState<Sermon[] | null>(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetchJson<Sermon[]>('/api/admin/sermons')
      .then(setSermons)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load sermons.'));
  };

  useEffect(load, []);

  const toFormValues = (sermon?: Sermon) => ({
    title: sermon?.title ?? '',
    speaker: sermon?.speaker ?? '',
    description: sermon?.description ?? '',
    series: sermon?.series ?? '',
    date: sermon?.date ?? '',
    duration: sermon?.duration ?? '',
    videoUrl: sermon?.videoUrl ?? '',
    audioUrl: sermon?.audioUrl ?? '',
  });

  const create = async (values: typeof emptySermonForm) => {
    setSaving(true);
    setError('');
    try {
      await fetchJson('/api/admin/sermons', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...values, videoUrl: values.videoUrl || null, audioUrl: values.audioUrl || null }),
      });
      setAdding(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the sermon.');
    } finally {
      setSaving(false);
    }
  };

  const update = async (id: number, values: typeof emptySermonForm) => {
    setSaving(true);
    setError('');
    try {
      await fetchJson(`/api/admin/sermons/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...values, videoUrl: values.videoUrl || null, audioUrl: values.audioUrl || null }),
      });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the sermon.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Remove this sermon? This cannot be undone.')) return;
    try {
      await fetchJson(`/api/admin/sermons/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove the sermon.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-primary">Sermons</h2>
        {!adding && (
          <button type="button" onClick={() => { setAdding(true); setEditingId(null); }} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">
            <Plus size={15} /> Add sermon
          </button>
        )}
      </div>
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
      {adding && <SermonForm initial={emptySermonForm} saving={saving} onCancel={() => setAdding(false)} onSave={create} />}
      {sermons === null ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={15} className="animate-spin" /> Loading sermons…</p>
      ) : sermons.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sermons yet.</p>
      ) : (
        <div className="space-y-4">
          {sermons.map((sermon) =>
            editingId === sermon.id ? (
              <SermonForm key={sermon.id} initial={toFormValues(sermon)} saving={saving} onCancel={() => setEditingId(null)} onSave={(values) => update(sermon.id, values)} />
            ) : (
              <div key={sermon.id} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-secondary">{sermon.series} · {formatDate(sermon.date)}</p>
                    <h3 className="mt-1 font-display text-xl text-primary">{sermon.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{sermon.speaker} · {sermon.duration}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{sermon.description}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => { setEditingId(sermon.id); setAdding(false); }} className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 px-3.5 py-2 text-xs font-bold text-primary"><Pencil size={13} /> Edit</button>
                    <button type="button" onClick={() => remove(sermon.id)} className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3.5 py-2 text-xs font-bold text-red-700"><Trash2 size={13} /> Delete</button>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function ArticleForm({ initial, onCancel, onSave, saving }: { initial: typeof emptyArticleForm; onCancel: () => void; onSave: (values: typeof emptyArticleForm) => void; saving: boolean }) {
  const [values, setValues] = useState(initial);

  const set = (key: keyof typeof emptyArticleForm) => (event: { target: { value: string } }) =>
    setValues((prev) => ({ ...prev, [key]: event.target.value }));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(values);
      }}
      className="grid gap-4 rounded-2xl border border-border bg-muted/40 p-6 sm:grid-cols-2"
    >
      <label className="block text-sm font-semibold text-primary sm:col-span-2">Title
        <input required value={values.title} onChange={set('title')} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
      </label>
      <label className="block text-sm font-semibold text-primary">Category
        <input required value={values.category} onChange={set('category')} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
      </label>
      <label className="block text-sm font-semibold text-primary">Author
        <input required value={values.author} onChange={set('author')} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
      </label>
      <label className="block text-sm font-semibold text-primary sm:col-span-2">Excerpt <span className="font-normal text-muted-foreground">(short teaser shown on the article list)</span>
        <textarea required rows={2} value={values.excerpt} onChange={set('excerpt')} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
      </label>
      <label className="block text-sm font-semibold text-primary sm:col-span-2">Full article
        <textarea required rows={8} value={values.content} onChange={set('content')} placeholder="Separate paragraphs with a blank line." className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
      </label>
      <label className="block text-sm font-semibold text-primary sm:col-span-2">Cover image URL <span className="font-normal text-muted-foreground">(optional)</span>
        <input value={values.coverImageUrl} onChange={set('coverImageUrl')} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold text-primary sm:col-span-2">
        <input type="checkbox" checked={values.published} onChange={(event) => setValues((prev) => ({ ...prev, published: event.target.checked }))} className="h-4 w-4 rounded border-border" />
        Published (visible on the public Articles page)
      </label>
      <div className="flex gap-3 sm:col-span-2">
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60">
          {saving && <Loader2 size={15} className="animate-spin" />} Save article
        </button>
        <button type="button" onClick={onCancel} className="rounded-full border border-primary/20 px-5 py-2.5 text-sm font-bold text-primary">Cancel</button>
      </div>
    </form>
  );
}

function ArticlesPanel() {
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetchJson<Article[]>('/api/admin/articles')
      .then(setArticles)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load articles.'));
  };

  useEffect(load, []);

  const toFormValues = (article?: Article) => ({
    title: article?.title ?? '',
    excerpt: article?.excerpt ?? '',
    content: article?.content ?? '',
    category: article?.category ?? '',
    author: article?.author ?? '',
    coverImageUrl: article?.coverImageUrl ?? '',
    published: article?.published ?? true,
  });

  const save = async (id: number | null, values: typeof emptyArticleForm) => {
    setSaving(true);
    setError('');
    try {
      await fetchJson(id ? `/api/admin/articles/${id}` : '/api/admin/articles', {
        method: id ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...values, coverImageUrl: values.coverImageUrl || null }),
      });
      setAdding(false);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the article.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Remove this article? This cannot be undone.')) return;
    try {
      await fetchJson(`/api/admin/articles/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove the article.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-primary">Articles</h2>
        {!adding && (
          <button type="button" onClick={() => { setAdding(true); setEditingId(null); }} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">
            <Plus size={15} /> Write article
          </button>
        )}
      </div>
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
      {adding && <ArticleForm initial={emptyArticleForm} saving={saving} onCancel={() => setAdding(false)} onSave={(values) => save(null, values)} />}
      {articles === null ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={15} className="animate-spin" /> Loading articles…</p>
      ) : articles.length === 0 ? (
        <p className="text-sm text-muted-foreground">No articles yet.</p>
      ) : (
        <div className="space-y-4">
          {articles.map((article) =>
            editingId === article.id ? (
              <ArticleForm key={article.id} initial={toFormValues(article)} saving={saving} onCancel={() => setEditingId(null)} onSave={(values) => save(article.id, values)} />
            ) : (
              <div key={article.id} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-secondary">
                      {article.category} · {formatDate(article.createdAt)} {!article.published && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Draft</span>}
                    </p>
                    <h3 className="mt-1 font-display text-xl text-primary">{article.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">By {article.author}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{article.excerpt}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => { setEditingId(article.id); setAdding(false); }} className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 px-3.5 py-2 text-xs font-bold text-primary"><Pencil size={13} /> Edit</button>
                    <button type="button" onClick={() => remove(article.id)} className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3.5 py-2 text-xs font-bold text-red-700"><Trash2 size={13} /> Delete</button>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function VideoForm({ initial, onCancel, onSave, saving }: { initial: typeof emptyVideoForm; onCancel: () => void; onSave: (values: typeof emptyVideoForm) => void; saving: boolean }) {
  const [values, setValues] = useState(initial);

  const set = (key: keyof typeof emptyVideoForm) => (event: { target: { value: string } }) =>
    setValues((prev) => ({ ...prev, [key]: event.target.value }));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(values);
      }}
      className="grid gap-4 rounded-2xl border border-border bg-muted/40 p-6 sm:grid-cols-2"
    >
      <label className="block text-sm font-semibold text-primary sm:col-span-2">Title
        <input required value={values.title} onChange={set('title')} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
      </label>
      <label className="block text-sm font-semibold text-primary sm:col-span-2">YouTube link or video URL
        <input required placeholder="https://www.youtube.com/watch?v=... or any embeddable link" value={values.sourceUrl} onChange={set('sourceUrl')} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
      </label>
      <label className="block text-sm font-semibold text-primary">Category <span className="font-normal text-muted-foreground">(optional)</span>
        <input value={values.category} onChange={set('category')} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
      </label>
      <label className="block text-sm font-semibold text-primary">Thumbnail URL <span className="font-normal text-muted-foreground">(auto for YouTube)</span>
        <input value={values.thumbnailUrl} onChange={set('thumbnailUrl')} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
      </label>
      <label className="block text-sm font-semibold text-primary sm:col-span-2">Description <span className="font-normal text-muted-foreground">(optional)</span>
        <textarea rows={2} value={values.description} onChange={set('description')} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
      </label>
      <div className="flex gap-3 sm:col-span-2">
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60">
          {saving && <Loader2 size={15} className="animate-spin" />} Save video
        </button>
        <button type="button" onClick={onCancel} className="rounded-full border border-primary/20 px-5 py-2.5 text-sm font-bold text-primary">Cancel</button>
      </div>
    </form>
  );
}

function VideosPanel() {
  const [videos, setVideos] = useState<VideoItem[] | null>(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetchJson<VideoItem[]>('/api/admin/videos')
      .then(setVideos)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load videos.'));
  };

  useEffect(load, []);

  const toFormValues = (video?: VideoItem) => ({
    title: video?.title ?? '',
    description: video?.description ?? '',
    category: video?.category ?? '',
    sourceUrl: video?.sourceUrl ?? '',
    thumbnailUrl: video?.thumbnailUrl ?? '',
  });

  const save = async (id: number | null, values: typeof emptyVideoForm) => {
    setSaving(true);
    setError('');
    try {
      await fetchJson(id ? `/api/admin/videos/${id}` : '/api/admin/videos', {
        method: id ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...values,
          description: values.description || null,
          category: values.category || null,
          thumbnailUrl: values.thumbnailUrl || null,
        }),
      });
      setAdding(false);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the video.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Remove this video? This cannot be undone.')) return;
    try {
      await fetchJson(`/api/admin/videos/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove the video.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-primary">Videos</h2>
        {!adding && (
          <button type="button" onClick={() => { setAdding(true); setEditingId(null); }} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">
            <Plus size={15} /> Add video
          </button>
        )}
      </div>
      <p className="text-sm text-muted-foreground">Paste a YouTube link (watch, shorts, or youtu.be) or any other embeddable video link. It plays inline on the public Videos page when clicked.</p>
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
      {adding && <VideoForm initial={emptyVideoForm} saving={saving} onCancel={() => setAdding(false)} onSave={(values) => save(null, values)} />}
      {videos === null ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={15} className="animate-spin" /> Loading videos…</p>
      ) : videos.length === 0 ? (
        <p className="text-sm text-muted-foreground">No videos yet.</p>
      ) : (
        <div className="space-y-4">
          {videos.map((video) =>
            editingId === video.id ? (
              <VideoForm key={video.id} initial={toFormValues(video)} saving={saving} onCancel={() => setEditingId(null)} onSave={(values) => save(video.id, values)} />
            ) : (
              <div key={video.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border bg-card p-6">
                <div className="flex gap-4">
                  {video.thumbnailUrl && <img src={video.thumbnailUrl} alt="" className="h-16 w-28 shrink-0 rounded-lg object-cover" />}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-secondary">{video.category || 'Video'} · {formatDate(video.createdAt)}</p>
                    <h3 className="mt-1 font-display text-lg text-primary">{video.title}</h3>
                    <p className="mt-1 break-all text-xs text-muted-foreground">{video.sourceUrl}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => { setEditingId(video.id); setAdding(false); }} className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 px-3.5 py-2 text-xs font-bold text-primary"><Pencil size={13} /> Edit</button>
                  <button type="button" onClick={() => remove(video.id)} className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3.5 py-2 text-xs font-bold text-red-700"><Trash2 size={13} /> Delete</button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function PrayersPanel() {
  const [prayers, setPrayers] = useState<PrayerRequest[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJson<PrayerRequest[]>('/api/admin/prayers')
      .then(setPrayers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load prayer requests.'));
  }, []);

  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl text-primary">Prayer requests</h2>
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
      {prayers === null ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={15} className="animate-spin" /> Loading prayer requests…</p>
      ) : prayers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No prayer requests yet.</p>
      ) : (
        <div className="space-y-3">
          {prayers.map((prayer) => (
            <div key={prayer.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-secondary">
                <span>{prayer.anonymous || !prayer.name ? 'Anonymous' : prayer.name}</span>
                <span className="text-muted-foreground">{formatDate(prayer.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-primary">{prayer.request}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MembersPanel() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJson<Member[]>('/api/admin/members')
      .then(setMembers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load new members.'));
  }, []);

  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl text-primary">New members</h2>
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
      {members === null ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={15} className="animate-spin" /> Loading new members…</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-muted-foreground">No new member registrations yet.</p>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-lg text-primary">{member.firstName} {member.lastName}</h3>
                <span className="text-xs font-semibold text-muted-foreground">Registered {formatDate(member.createdAt)}</span>
              </div>
              <div className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                <span>{member.phone}</span>
                <span>{member.email}</span>
                <span>{member.gender} · {member.occupation}</span>
                <span>{member.address}</span>
                {member.birthday && <span>Birthday: {formatDate(member.birthday)}</span>}
              </div>
              {member.prayerRequest && <p className="mt-3 rounded-xl bg-muted px-4 py-3 text-sm leading-6 text-primary">{member.prayerRequest}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkersPanel({ currentAdminId }: { currentAdminId: string }) {
  const [workers, setWorkers] = useState<Worker[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJson<Worker[]>('/api/admin/workers')
      .then(setWorkers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load workers.'));
  }, []);

  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl text-primary">Media Admin workers</h2>
      <p className="text-sm text-muted-foreground">Everyone who has created a Media Admin account. Share the access token with new team members and they can create their own account at <span className="font-semibold text-primary">/admin/signup</span>.</p>
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
      {workers === null ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={15} className="animate-spin" /> Loading workers…</p>
      ) : (
        <div className="space-y-3">
          {workers.map((worker) => (
            <div key={worker.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-5">
              <div>
                <p className="font-display text-lg text-primary">{worker.name} {worker.id === currentAdminId && <span className="ml-2 rounded-full bg-secondary/20 px-2.5 py-0.5 text-xs font-bold text-primary">You</span>}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{worker.id}</p>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">Since {formatDate(worker.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminDashboardPage() {
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<AdminSession | null | 'loading'>('loading');
  const [tab, setTab] = useState<Tab>('sermons');

  useEffect(() => {
    let active = true;
    fetchJson<AdminSession>('/api/admin/session')
      .then((data) => { if (active) setSession(data); })
      .catch(() => { if (active) setLocation('/admin/login'); });
    return () => { active = false; };
  }, [setLocation]);

  if (session === 'loading' || session === null) {
    return (
      <main className="grid min-h-[60dvh] place-items-center px-5">
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={16} className="animate-spin" /> Checking your admin session…</p>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-background px-5 py-12 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin/live" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft size={16} /> Back to broadcast studio</Link>
        <div className="mb-4 flex items-center gap-3 text-accent"><span className="gold-rule" /><span className="eyebrow">Media Admin dashboard</span></div>
        <h1 className="font-display text-4xl leading-tight text-primary">Welcome, {session.admin.name}.</h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">Manage sermons and review what the congregation has been sharing.</p>

        <div className="mt-8 flex flex-wrap gap-2">
          <TabButton active={tab === 'sermons'} onClick={() => setTab('sermons')} icon={<Radio size={15} />} label="Sermons" />
          <TabButton active={tab === 'articles'} onClick={() => setTab('articles')} icon={<FileText size={15} />} label="Articles" />
          <TabButton active={tab === 'videos'} onClick={() => setTab('videos')} icon={<Video size={15} />} label="Videos" />
          <TabButton active={tab === 'prayers'} onClick={() => setTab('prayers')} icon={<HandHeart size={15} />} label="Prayer requests" />
          <TabButton active={tab === 'members'} onClick={() => setTab('members')} icon={<Users size={15} />} label="New members" />
          <TabButton active={tab === 'workers'} onClick={() => setTab('workers')} icon={<UsersRound size={15} />} label="Workers" />
        </div>

        <div className="mt-8">
          {tab === 'sermons' && <SermonsPanel />}
          {tab === 'articles' && <ArticlesPanel />}
          {tab === 'videos' && <VideosPanel />}
          {tab === 'prayers' && <PrayersPanel />}
          {tab === 'members' && <MembersPanel />}
          {tab === 'workers' && <WorkersPanel currentAdminId={session.admin.id} />}
        </div>
      </div>
    </main>
  );
}
