import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type UserRole = Database["public"]["Enums"]["user_role"];

export type SessionContext = {
  userId: string;
  email: string | null;
  fullName: string;
  role: UserRole;
  organizationId: string;
  nurseryName: string;
  preferredLanguage: Database["public"]["Enums"]["app_language"];
};

/**
 * Loads the authenticated user's profile + org (the "who am I" context every
 * protected page needs). Redirects to /login if there is no valid session or
 * no active profile. RLS guarantees the profile/org belong to the caller.
 */
export async function requireSession(): Promise<SessionContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, role, organization_id, preferred_language, active, organizations(name)",
    )
    .eq("id", user.id)
    .single();

  if (!profile || !profile.active) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    fullName: profile.full_name,
    role: profile.role,
    organizationId: profile.organization_id,
    nurseryName: profile.organizations?.name ?? "Plantory",
    preferredLanguage: profile.preferred_language,
  };
}
