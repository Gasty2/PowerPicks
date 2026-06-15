import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import { getSupabaseEnv } from "@/lib/supabase/env";

export async function createClient() {
  const cookieStore = await cookies();
  const { supabasePublishableKey, supabaseUrl } = getSupabaseEnv();

  return createServerClient<Database>(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, options, value }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot set cookies; Server Actions and proxy refreshes can.
        }
      },
    },
  });
}
