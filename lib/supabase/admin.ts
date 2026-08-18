import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Service-role client that BYPASSES RLS. Use only in trusted server code for
 * narrow, audited operations (e.g. provisioning auth users). NEVER import this
 * into a client component — the `server-only` guard makes that a build error.
 * See CLAUDE.md §0.4 and §1.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
