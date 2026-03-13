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

export function registerImageTools(
  server: McpServer,
  supabase: SupabaseClient,
) {
  server.tool(
    "upload_image",
    "Upload an image to storage. Returns the public URL. Use this before creating content that needs images.",
    {
      image: z.string().describe("Base64-encoded image data"),
      filename: z.string().describe("Original filename (e.g., 'photo.jpg')"),
      content_type: z
        .enum(["image/jpeg", "image/png", "image/webp", "image/gif"])
        .describe("MIME type"),
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
    async ({ image, filename, content_type, category }) => {
      if (!ALLOWED_MIME_TYPES.includes(content_type)) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: false,
                error: `Unsupported type: ${content_type}`,
              }),
            },
          ],
          isError: true,
        };
      }

      const buffer = Buffer.from(image, "base64");
      if (buffer.byteLength > MAX_SIZE_BYTES) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: false,
                error: `Image too large: ${(buffer.byteLength / 1024 / 1024).toFixed(1)}MB. Max: 5MB`,
              }),
            },
          ],
          isError: true,
        };
      }

      const ext = filename.split(".").pop() || "jpg";
      const prefix = CATEGORY_PREFIXES[category] || "";
      const path = `${prefix}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, buffer, {
          contentType: content_type,
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ success: false, error: error.message }),
            },
          ],
          isError: true,
        };
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(path);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              data: { url: publicUrl, path },
            }),
          },
        ],
      };
    },
  );
}
