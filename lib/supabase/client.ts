import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";

export const createClient = () =>
  createSupabaseClient(supabaseUrl, supabasePublishableKey);
