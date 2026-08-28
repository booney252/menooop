import "server-only";

import { createClient } from "@supabase/supabase-js";
import { serviceRoleKey, supabaseEnv } from "@/lib/env";

/**
 * Bypasses row-level security. Only two things may use it: deleting an
 * account for real, and the founder-only admin counts. Never import this into
 * anything that renders for a user.
 */
export function supabaseAdmin() {
  const { url } = supabaseEnv();
  return createClient(url, serviceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
