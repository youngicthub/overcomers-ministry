'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, LogIn, ShieldCheck } from 'lucide-react';

type Admin = { id: string; name: string; createdAt: string };
type Mode = 'login' | 'signup';

const copy: Record<Mode, { eyebrow: string; title: string; intro: string; switchHref: string; switchLabel: string }> = {
  signup: {
    eyebrow: 'Create a Media Admin account',
    title: 'Sign up with the admin access token.',
    intro: 'Enter the access token your team shared with you, then choose your own name and password. You will use your password (not the token) to sign in from now on.',
    switchHref: '/admin/login',
    switchLabel: 'Already have an admin ID? Log in instead.',
  },
  login: {
    eyebrow: 'Private Media Admin access',
    title: 'Log in with your admin ID and password.',
    intro: 'Enter the Admin ID you were given at sign-up, and your password.',
    switchHref: '/admin/signup',
    switchLabel: 'New to the team? Sign up for an admin account.',
  },
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!response.ok) throw new Error(data?.error || 'Something went wrong. Please try again.');
  return data as T;
}

export function AdminAuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [adminId, setAdminId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [createdAdmin, setCreatedAdmin] = useState<Admin | null>(null);

  const text = copy[mode];

  const submitSignup = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setPending(true);
    try {
      const data = await postJson<{ admin: Admin }>('/api/admin/signup', {
        accessToken,
        name: name.trim(),
        password,
      });
      setCreatedAdmin(data.admin);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not create the account.');
    } finally {
      setPending(false);
    }
  };

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setPending(true);
    try {
      await postJson('/api/admin/login', { adminId: adminId.trim(), password });
      router.push('/admin/live');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Invalid admin ID or password.');
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-background px-5 py-12 sm:grid sm:place-items-center">
      <section className="mx-auto w-full max-w-xl">
        <Link href="/" data-testid="link-back-to-site" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft size={16} /> Back to the ministry site</Link>
        <div className="rounded-[2rem] border border-border bg-card p-7 shadow-sm sm:p-10">
          {mode === 'signup' && createdAdmin ? (
            <>
              <div className="flex items-center gap-3 text-accent"><CheckCircle2 size={23} /><span className="eyebrow">Account created</span></div>
              <h1 className="mt-5 font-display text-3xl leading-tight text-primary">Welcome, {createdAdmin.name}.</h1>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">Save this Admin ID somewhere safe — you'll need it together with your password every time you log in. It is not shown again.</p>
              <div className="mt-6 rounded-2xl border border-secondary/50 bg-secondary/10 p-6 text-center">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Your Admin ID</p>
                <p className="mt-3 select-all break-all font-mono text-2xl font-bold text-primary" data-testid="text-created-admin-id">{createdAdmin.id}</p>
              </div>
              <Link href="/admin/login" data-testid="link-go-to-login" className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground"><LogIn size={16} /> Continue to log in</Link>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 text-accent"><ShieldCheck size={23} /><span className="eyebrow">{text.eyebrow}</span></div>
              <h1 className="mt-5 font-display text-4xl leading-tight text-primary">{text.title}</h1>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{text.intro}</p>

              <form onSubmit={mode === 'signup' ? submitSignup : submitLogin} className="mt-8 space-y-5">
                {mode === 'signup' ? (
                  <>
                    <label className="block text-sm font-semibold text-primary">
                      Admin access token
                      <input type="password" autoComplete="off" data-testid="input-access-token" value={accessToken} onChange={(event) => setAccessToken(event.target.value)} required className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent" placeholder="Enter the server-issued token" />
                    </label>
                    <label className="block text-sm font-semibold text-primary">
                      Your name
                      <input value={name} onChange={(event) => setName(event.target.value)} required data-testid="input-admin-name" className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent" placeholder="e.g. Media Team Lead" />
                    </label>
                    <label className="block text-sm font-semibold text-primary">
                      Choose a password
                      <input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={10} data-testid="input-password" className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent" placeholder="At least 10 characters, letters + numbers" />
                    </label>
                    <label className="block text-sm font-semibold text-primary">
                      Confirm password
                      <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={10} data-testid="input-confirm-password" className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent" placeholder="Type your password again" />
                    </label>
                  </>
                ) : (
                  <>
                    <label className="block text-sm font-semibold text-primary">
                      Admin ID
                      <input value={adminId} onChange={(event) => setAdminId(event.target.value)} required data-testid="input-admin-id" className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent" placeholder="adm_…" />
                    </label>
                    <label className="block text-sm font-semibold text-primary">
                      Password
                      <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required data-testid="input-password" className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent" placeholder="Your password" />
                    </label>
                  </>
                )}
                {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
                <button type="submit" disabled={pending} data-testid="button-submit-auth" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60">
                  {pending ? <Loader2 size={16} className="animate-spin" /> : mode === 'signup' ? <KeyRound size={16} /> : <LogIn size={16} />} {mode === 'signup' ? 'Create my admin account' : 'Log in'}
                </button>
                <Link href={text.switchHref} data-testid="link-switch-mode" className="block text-center text-sm font-semibold text-primary hover:text-accent">{text.switchLabel}</Link>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
