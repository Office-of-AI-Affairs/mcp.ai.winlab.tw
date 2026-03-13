import { createClient } from "@supabase/supabase-js";
import { createAuthCode } from "@/lib/auth/auth-codes";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
  const { email, password, clientId, redirectUri, codeChallenge, state } = await request.json();

  if (!email || !password || !redirectUri || !codeChallenge) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return Response.json({ error: error?.message || "Authentication failed" }, { status: 401 });
  }

  const code = await createAuthCode({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    codeChallenge,
    redirectUri,
    clientId: clientId || "unknown",
  });

  const redirect = new URL(redirectUri);
  redirect.searchParams.set("code", code);
  if (state) redirect.searchParams.set("state", state);

  return Response.json({ redirectUrl: redirect.toString() });
}
