import { FormEvent, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, KeyRound, Loader2, ShieldCheck } from 'lucide-react';

type AdminChallenge = {
  challengeId: string;
  adminId: string;
  adminName: string;
  otp: string;
  expiresInSeconds: number;
};

export function AdminLoginPage() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState('');
  const [adminId, setAdminId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [otp, setOtp] = useState('');
  const [challenge, setChallenge] = useState<AdminChallenge | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const requestOtp = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setPending(true);
    try {
      const response = await fetch('/api/admin/otp/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          accessToken,
          ...(name.trim() ? { name: name.trim() } : {}),
          ...(adminId.trim() ? { adminId: adminId.trim() } : {}),
        }),
      });
      const data = await response.json() as AdminChallenge & { error?: string };
      if (!response.ok) throw new Error(data.error || 'Could not create an admin OTP.');
      setChallenge(data);
      setOtp('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not create an admin OTP.');
    } finally {
      setPending(false);
    }
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setPending(true);
    try {
      const response = await fetch('/api/admin/otp/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ challengeId: challenge?.challengeId, otp }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'The OTP is invalid or expired.');
      setLocation('/admin/live');
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'The OTP is invalid or expired.');
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-background px-5 py-12 sm:grid sm:place-items-center">
      <section className="mx-auto w-full max-w-xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft size={16} /> Back to the ministry site</Link>
        <div className="rounded-[2rem] border border-border bg-card p-7 shadow-sm sm:p-10">
          <div className="flex items-center gap-3 text-accent"><ShieldCheck size={23} /><span className="eyebrow">Private Media Admin access</span></div>
          <h1 className="mt-5 font-display text-4xl leading-tight text-primary">Enter the admin access token.</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">Admins are created individually without email verification. The server checks the access token, then displays a one-time OTP on this screen.</p>

          {!challenge ? (
            <form onSubmit={requestOtp} className="mt-8 space-y-5">
              <label className="block text-sm font-semibold text-primary">
                Admin access token
                <input type="password" autoComplete="off" value={accessToken} onChange={(event) => setAccessToken(event.target.value)} required className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent" placeholder="Enter the server-issued token" />
              </label>
              <label className="block text-sm font-semibold text-primary">
                New admin name <span className="font-normal text-muted-foreground">(leave blank when using an existing Admin ID)</span>
                <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent" placeholder="e.g. Media Team Lead" />
              </label>
              <label className="block text-sm font-semibold text-primary">
                Existing Admin ID <span className="font-normal text-muted-foreground">(optional)</span>
                <input value={adminId} onChange={(event) => setAdminId(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent" placeholder="adm_…" />
              </label>
              {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
              <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60">
                {pending ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />} Create or continue
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="mt-8 space-y-5">
              <div className="rounded-2xl border border-secondary/50 bg-secondary/10 p-6 text-center">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">On-screen OTP</p>
                <p className="mt-3 font-mono text-4xl font-bold tracking-[.32em] text-primary">{challenge.otp}</p>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">For {challenge.adminName}. This code expires in {Math.floor(challenge.expiresInSeconds / 60)} minutes.</p>
              </div>
              <div className="rounded-xl bg-muted px-4 py-3 text-xs leading-5 text-muted-foreground">Admin ID: <span className="font-mono font-semibold text-primary">{challenge.adminId}</span>. Save this ID for the next sign-in.</div>
              <label className="block text-sm font-semibold text-primary">
                Enter the OTP to continue
                <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} required className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-center font-mono text-xl tracking-[.3em] text-foreground outline-none focus:border-accent" placeholder="000000" />
              </label>
              {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="submit" disabled={pending || otp.length !== 6} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60">
                  {pending ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} Verify OTP
                </button>
                <button type="button" onClick={() => { setChallenge(null); setError(''); }} className="rounded-full border border-primary/20 px-5 py-3.5 text-sm font-bold text-primary">Start over</button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}