import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireAdmin } from "@/server/lib/admin-guard";
import { json, readJson, route } from "@/server/lib/http";

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB per photo
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Token endpoint for direct-to-Blob uploads. Vercel's serverless functions
// reject request bodies over ~4.5MB, so photos can't be posted through the
// API — the browser uploads straight to Blob using a short-lived, tightly
// scoped token minted here (admins only; images only; 8MB max).
export const POST = route(async (req) => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return json(
      {
        error:
          "Photo storage is not set up yet. In Vercel, open Storage → create a Blob store and connect it to this project, then redeploy.",
      },
      503,
    );
  }

  const body = (await readJson(req)) as HandleUploadBody;

  // Only the token request comes from a signed-in admin's browser. The
  // follow-up "upload completed" callback comes from Vercel itself (no
  // cookie) and is verified by handleUpload via its signature.
  if (body.type === "blob.generate-client-token") {
    const auth = await requireAdmin(req);
    if ("response" in auth) return auth.response;
  }

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_TYPES,
        maximumSizeInBytes: MAX_FILE_SIZE_BYTES,
        addRandomSuffix: true,
      }),
      // Photos are recorded by POST /api/admin/gallery after the browser
      // finishes uploading, so there's nothing to do here.
      onUploadCompleted: async () => {},
    });
    return json(result);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Could not start the upload." }, 400);
  }
});
