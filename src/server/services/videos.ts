import type { Video } from "../db";
import { resolveVideoEmbed } from "../lib/video-embed";

export function toPublicVideo(video: Video) {
  const resolved = resolveVideoEmbed(video.sourceUrl, video.thumbnailUrl);
  return {
    id: video.id,
    title: video.title,
    description: video.description,
    category: video.category,
    sourceUrl: video.sourceUrl,
    embedUrl: resolved.embedUrl,
    thumbnailUrl: resolved.thumbnailUrl,
    isDirectFile: resolved.isDirectFile,
    createdAt: video.createdAt.toISOString(),
    updatedAt: video.updatedAt.toISOString(),
  };
}
