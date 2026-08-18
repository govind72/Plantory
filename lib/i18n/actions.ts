"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isLocale, LOCALE_COOKIE, type Locale } from "./config";

/**
 * Sets the active UI language: writes the locale cookie (read by next-intl) and,
 * if the user is signed in, persists it to their profile via set_my_language().
 */
export async function setLanguage(locale: string): Promise<void> {
  if (!isLocale(locale)) return;

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.rpc("set_my_language", { p_lang: locale as Locale });
  }
}
