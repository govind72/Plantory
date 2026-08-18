"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";

export type LoginState = { error?: "invalidCredentials" | "inactiveAccount" };

/**
 * Email/password sign-in. On success, syncs the UI language cookie from the
 * user's saved preference, then redirects to the dashboard.
 */
export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "invalidCredentials" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("active, preferred_language")
    .eq("id", data.user.id)
    .single();

  if (!profile || !profile.active) {
    await supabase.auth.signOut();
    return { error: "inactiveAccount" };
  }

  if (isLocale(profile.preferred_language)) {
    const store = await cookies();
    store.set(LOCALE_COOKIE, profile.preferred_language, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
