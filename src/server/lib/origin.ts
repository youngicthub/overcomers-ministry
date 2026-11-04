/** Extra origins (comma-separated) that may make state-changing admin
 * requests, in addition to the site's own origin. Optional — the site's own
 * host (including preview deployments and custom domains) is always allowed,
 * so on a normal Vercel deployment you do not need to set this. */
function extraOrigins(): string[] {
  return (process.env.FRONTEND_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function ownHost(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-host");
  const host = forwarded ? forwarded.split(",")[0]?.trim() : req.headers.get("host");
  return host || null;
}

function isAllowed(value: string, req: Request): boolean {
  try {
    const url = new URL(value);
    return url.host === ownHost(req) || extraOrigins().includes(url.origin);
  } catch {
    return false;
  }
}

/** CSRF defense-in-depth for state-changing admin requests: a present
 * Origin (or, failing that, Referer) must be this site. Requests carrying
 * neither header are let through — that is normal for same-origin requests
 * in some browsers — and the SameSite=Strict session cookie still protects
 * them. */
export function isTrustedOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (origin) return isAllowed(origin, req);
  const referer = req.headers.get("referer");
  if (referer) return isAllowed(referer, req);
  return true;
}
