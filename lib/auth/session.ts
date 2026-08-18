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

/** Like requireSession, but also requires Owner/Admin (redirects Staff/Managers). */
export async function requireAdmin(): Promise<SessionContext> {
  const session = await requireSession();
  if (session.role !== "owner" && session.role !== "admin") {
    redirect("/dashboard");
  }
  return session;
}

/** Requires Owner/Admin/Outlet-Manager (redirects Staff). */
export async function requireManager(): Promise<SessionContext> {
  const session = await requireSession();
  if (
    session.role !== "owner" &&
    session.role !== "admin" &&
    session.role !== "outlet_manager"
  ) {
    redirect("/dashboard");
  }
  return session;
}

/** Outlets the caller may act in: all org outlets for Owner/Admin, else assigned. */
export async function accessibleOutlets(
  session: SessionContext,
): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  if (session.role === "owner" || session.role === "admin") {
    const { data } = await supabase
      .from("outlets")
      .select("id, name")
      .eq("active", true)
      .order("name");
    return data ?? [];
  }
  const { data } = await supabase
    .from("user_outlets")
    .select("outlet:outlets(id, name)")
    .eq("user_id", session.userId);
  return (data ?? [])
    .map((r) => r.outlet)
    .filter((o): o is { id: string; name: string } => Boolean(o));
}
