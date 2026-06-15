import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import { getSupabaseEnv } from "@/lib/supabase/env";

export function createClient() {
  const { supabasePublishableKey, supabaseUrl } = getSupabaseEnv();

  return createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
}
