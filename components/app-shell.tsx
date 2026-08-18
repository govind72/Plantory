import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { logout } from "@/lib/auth/actions";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import type { SessionContext } from "@/lib/auth/session";

/**
 * Minimal authenticated shell for M2 (dynamic nursery name, role-gated nav,
 * language, sign out). The full responsive navigation is built in M3.
 */
export function AppShell({
  session,
  children,
}: {
  session: SessionContext;
  children: ReactNode;
}) {
  const t = useTranslations();
  const isAdmin = session.role === "owner" || session.role === "admin";

  const navItems: { href: string; label: string }[] = [
    { href: "/dashboard", label: t("nav.dashboard") },
    ...(isAdmin
      ? [
          { href: "/settings", label: t("nav.settings") },
          { href: "/users", label: t("nav.users") },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="font-semibold leading-tight">{session.nurseryName}</p>
            <p className="text-xs text-muted-foreground">{t("app.name")}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-medium">{session.fullName}</p>
              <p className="text-xs text-muted-foreground">
                {t(`roles.${session.role}`)}
              </p>
            </div>
            <LanguageSwitcher />
            <form action={logout}>
              <Button variant="outline" size="sm" type="submit">
                {t("auth.signOut")}
              </Button>
            </form>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
