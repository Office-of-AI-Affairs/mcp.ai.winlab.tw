import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";

export interface StoredAuthData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number | null;
  codeChallenge: string;
  redirectUri: string;
  clientId: string;
  resource?: string;
}

export async function createAuthCode(data: StoredAuthData): Promise<string> {
  const code = randomBytes(32).toString("hex");
  const supabase = createClient(supabaseUrl, supabasePublishableKey);

  const { error } = await supabase.from("oauth_auth_codes").insert({
    code,
    data,
  });

  if (error) throw new Error(`Failed to store auth code: ${error.message}`);
  return code;
}

export async function exchangeAuthCode(
  code: string
): Promise<StoredAuthData | null> {
  const supabase = createClient(supabaseUrl, supabasePublishableKey);

  const { data: row, error } = await supabase
    .from("oauth_auth_codes")
    .select("data, expires_at")
    .eq("code", code)
    .single();

  if (error || !row) return null;

  // Check expiry
  if (new Date(row.expires_at) < new Date()) {
    await supabase.from("oauth_auth_codes").delete().eq("code", code);
    return null;
  }

  // Single-use: delete after read
  await supabase.from("oauth_auth_codes").delete().eq("code", code);

  return row.data as StoredAuthData;
}
