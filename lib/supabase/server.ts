import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

/**
 * Per-request Supabase client bound to the user's session cookies.
 * RLS applies — this is the client used for all normal reads/writes
 * in Server Components and Server Actions (CLAUDE.md §1).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // In Server Components cookie writes throw; middleware refreshes the
          // session instead, so it is safe to ignore here.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // no-op (called from a Server Component)
          }
        },
      },
    },
  );
}
