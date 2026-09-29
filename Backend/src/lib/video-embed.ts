/**
 * Admins paste whatever link they were given — a normal YouTube "watch"
 * link, a shortened youtu.be link, a Shorts link, an already-embeddable
 * URL, or a link to some other provider (Vimeo player URL, a direct .mp4,
 * a Facebook video embed, etc). The public site should never have to care
 * which shape a link comes in — every video needs one thing: a URL that is
 * safe to drop straight into an <iframe src="..."> (or, for a direct file
 * link, a <video src="...">) and, when possible, a thumbnail.
 *
 * This module resolves that once on the server, so the frontend just
 * renders `embedUrl` (and `isDirectFile` to choose <video> vs <iframe>).
 */

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

function extractYouTubeId(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) return null;

  if (host.includes("youtu.be")) {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id || null;
  }

  // /watch?v=ID
  const vParam = url.searchParams.get("v");
  if (vParam) return vParam;

  // /embed/ID, /shorts/ID, /live/ID
  const segments = url.pathname.split("/").filter(Boolean);
  const knownPrefixes = ["embed", "shorts", "live"];
  const prefixIndex = segments.findIndex((segment) =>
    knownPrefixes.includes(segment),
  );
  if (prefixIndex !== -1 && segments[prefixIndex + 1]) {
    return segments[prefixIndex + 1];
  }

  return null;
}

function looksLikeDirectVideoFile(pathname: string): boolean {
  return /\.(mp4|webm|ogg|mov|m3u8)$/i.test(pathname);
}

export type ResolvedVideo = {
  embedUrl: string;
  thumbnailUrl: string | null;
  isDirectFile: boolean;
};

export function resolveVideoEmbed(
  sourceUrl: string,
  thumbnailOverride?: string | null,
): ResolvedVideo {
  let url: URL;
  try {
    url = new URL(sourceUrl);
  } catch {
    // Not a parseable URL at all — hand it back as-is and let the
    // frontend attempt to render it directly; validation on the way in
    // (insertVideoSchema) already requires a non-empty string.
    return {
      embedUrl: sourceUrl,
      thumbnailUrl: thumbnailOverride ?? null,
      isDirectFile: false,
    };
  }

  const youTubeId = extractYouTubeId(url);
  if (youTubeId) {
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${youTubeId}`,
      thumbnailUrl:
        thumbnailOverride || `https://img.youtube.com/vi/${youTubeId}/hqdefault.jpg`,
      isDirectFile: false,
    };
  }

  if (looksLikeDirectVideoFile(url.pathname)) {
    return {
      embedUrl: url.toString(),
      thumbnailUrl: thumbnailOverride ?? null,
      isDirectFile: true,
    };
  }

  // Anything else (Vimeo player URLs, Facebook video embeds, etc) is
  // assumed to already be embeddable as given.
  return {
    embedUrl: url.toString(),
    thumbnailUrl: thumbnailOverride ?? null,
    isDirectFile: false,
  };
}
