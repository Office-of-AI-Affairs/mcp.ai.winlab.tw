import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";

export function createClientWithToken(accessToken: string) {
  return createSupabaseClient(supabaseUrl, supabasePublishableKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}

export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSupabaseClient(supabaseUrl, serviceKey);
}
