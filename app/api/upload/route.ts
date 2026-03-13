import { createClient } from "@supabase/supabase-js";
import { createClientWithToken } from "@/lib/supabase/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

async function authenticateRequest(request: Request) {
  const url = new URL(request.url);
  const uploadToken = url.searchParams.get("token");

  // Method 1: One-time upload token (from MCP create_upload_url tool)
  if (uploadToken) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: row, error } = await supabase
      .from("upload_tokens")
      .select("user_id, category, expires_at, used")
      .eq("token", uploadToken)
      .single();

    if (error || !row) return { error: "Invalid upload token" };
    if (row.used) return { error: "Upload token already used" };
    if (new Date(row.expires_at) < new Date()) return { error: "Upload token expired" };

    // Mark as used
    await supabase.from("upload_tokens").update({ used: true }).eq("token", uploadToken);

    // Use anon client for storage upload (RLS on storage bucket allows public uploads)
    return {
      supabase,
      userId: row.user_id,
      category: row.category,
    };
  }

  // Method 2: Bearer token (direct API usage)
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return { error: "Missing authorization" };

  const supabase = createClientWithToken(token);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: "Invalid or expired token" };

  return { supabase, userId: user.id };
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: 401 });
  }

  const { supabase } = auth;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  // Category from form data, or from upload token
  const category = (formData.get("category") as string) || auth.category || "announcement";

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
