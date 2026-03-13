import { createClientWithToken } from "@/lib/supabase/server";

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

export async function POST(request: Request) {
  // Auth: same Bearer token as MCP endpoint
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return Response.json({ error: "Missing Authorization header" }, { status: 401 });
  }

  const supabase = createClientWithToken(token);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  // Parse multipart form data
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const category = (formData.get("category") as string) || "announcement";

  if (!file) {
    return Response.json({ error: "Missing 'file' field" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return Response.json(
      { error: `Unsupported type: ${file.type}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}` },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return Response.json(
      { error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 5MB` },
      { status: 400 },
    );
  }

  const ext = file.name.split(".").pop() || "jpg";
  const prefix = CATEGORY_PREFIXES[category] || "";
  const path = `${prefix}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, new Uint8Array(arrayBuffer), {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return Response.json({ success: true, url: publicUrl, path });
}
