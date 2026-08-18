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

  // Language reconciliation: the language the user actively selected on the
  // login screen (cookie) wins and is persisted to their profile. Only when no
  // choice was made do we seed the cookie from their saved profile preference.
  const store = await cookies();
  const chosen = store.get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) {
    if (chosen !== profile.preferred_language) {
      await supabase.rpc("set_my_language", { p_lang: chosen });
    }
  } else if (isLocale(profile.preferred_language)) {
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

export type ForgotState = { sent: boolean };

/**
 * Sends a password-reset email. Always reports "sent" so we never reveal which
 * emails have accounts. The link lands on /auth/callback which exchanges the
 * code for a recovery session, then forwards to /reset-password.
 */
export async function requestPasswordReset(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const email = String(formData.get("email") ?? "").trim();
  if (email) {
    const supabase = await createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
    });
  }
  return { sent: true };
}

export type ResetState = { status: "idle" | "error" | "tooShort" | "noSession" };

/** Sets a new password using the recovery session, then signs into the app. */
export async function updatePassword(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { status: "tooShort" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "noSession" };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { status: "error" };

  redirect("/dashboard");
}
