"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { setLanguage } from "@/lib/i18n/actions";
import { locales, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const LABELS: Record<Locale, string> = {
  en: "EN",
  hi: "हिं",
};

/**
 * Two-option language toggle (English / Hindi). Persists via setLanguage()
 * then refreshes so server components re-render in the new locale.
 */
export function LanguageSwitcher() {
  const active = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function choose(locale: Locale) {
    if (locale === active) return;
    startTransition(async () => {
      await setLanguage(locale);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center rounded-md border p-0.5"
    >
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => choose(locale)}
          disabled={isPending}
          aria-pressed={locale === active}
          className={cn(
            "rounded-sm px-2 py-1 text-xs font-medium transition-colors",
            locale === active
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {LABELS[locale]}
        </button>
      ))}
    </div>
  );
}
