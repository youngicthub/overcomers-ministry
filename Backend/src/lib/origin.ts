import type { Request } from "express";

/** Comma-separated list of origins the frontend is served from, e.g.
 * "https://overcomers.church,https://www.overcomers.church". Configure
 * this in production — an empty/unset value falls back to common local
 * dev ports only, which will correctly reject real cross-site traffic. */
function allowedOrigins(): string[] {
  const configured = process.env.FRONTEND_ORIGIN;
  if (configured) {
    return configured
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
  }
  return ["http://localhost:5173", "http://127.0.0.1:5173"];
}

export function isAllowedOrigin(origin: string | undefined | null): boolean {
  if (!origin) return false;
  return allowedOrigins().includes(origin);
}

/** For requests that don't carry an Origin header (some same-site GETs,
 * some non-browser clients), fall back to checking Referer's origin. If
 * neither header is present at all, we allow it through — that's normal
 * for same-origin requests in several browsers/proxy setups — but any
 * Origin/Referer that IS present and doesn't match is rejected. */
export function isTrustedOrigin(req: Request): boolean {
  const origin = req.headers.origin;
  if (origin) return isAllowedOrigin(origin);

  const referer = req.headers.referer;
  if (referer) {
    try {
      return isAllowedOrigin(new URL(referer).origin);
    } catch {
      return false;
    }
  }

  return true;
}

export { allowedOrigins };
