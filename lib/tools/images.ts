import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const BUCKET = "announcement-images";
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const CATEGORY_PREFIXES: Record<string, string> = {
  announcement: "",
  recruitment: "recruitment/",
  result: "results/",
  event: "events/",
  carousel: "carousel/",
  organization: "organization/",
};

function success(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ success: true, data }) }],
  };
}

function error(message: string) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: message }) }],
    isError: true,
  };
}

function getExtFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[mime] || "jpg";
}

function generatePath(category: string, ext: string): string {
  const prefix = CATEGORY_PREFIXES[category] || "";
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
}

async function uploadToStorage(
  supabase: SupabaseClient,
  path: string,
  buffer: Buffer | Uint8Array,
  contentType: string,
) {
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) return error(uploadError.message);

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return success({ url: publicUrl, path });
}

export function registerImageTools(
  server: McpServer,
  supabase: SupabaseClient,
) {
  server.tool(
    "upload_image",
    `Upload an image from a public URL to storage. Returns the public URL for use in other tools (e.g. create_recruitment, create_result).

For images on the web: pass the URL directly.
For LOCAL files on disk: do NOT use this tool. Instead, use curl to POST the file to /api/upload:
  curl -X POST https://mcp.ai.winlab.tw/api/upload -H "Authorization: Bearer <token>" -F "file=@/path/to/image.jpg" -F "category=recruitment"
The response JSON contains the public URL you can then use in other tools.`,
    {
      url: z.string().url().describe("Public URL of the image to download and upload"),
      category: z
        .enum([
          "announcement",
          "recruitment",
          "result",
          "event",
          "carousel",
          "organization",
        ])
        .describe("Category determines storage path prefix"),
    },
    async ({ url, category }) => {
      const response = await fetch(url);
      if (!response.ok) {
        return error(`Failed to download image: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type")?.split(";")[0] || "image/jpeg";
      if (!ALLOWED_MIME_TYPES.includes(contentType)) {
        return error(`Unsupported image type: ${contentType}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength > MAX_SIZE_BYTES) {
        return error(`Image too large: ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(1)}MB. Max: 5MB`);
      }

      const ext = getExtFromMime(contentType);
      const path = generatePath(category, ext);

      return uploadToStorage(supabase, path, new Uint8Array(arrayBuffer), contentType);
    },
  );
}
