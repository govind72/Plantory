import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/auth/actions";
import { MainNav } from "@/components/main-nav";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import type { SessionContext } from "@/lib/auth/session";

/**
 * Responsive app shell — one component set:
 *  - tablet/desktop (md+): fixed left sidebar
 *  - mobile (<md): top bar + fixed bottom navigation
 * Dynamic nursery name, role-gated nav, language + theme + sign out.
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

  const controls = (
    <div className="flex items-center gap-1">
      <LanguageSwitcher />
      <ThemeToggle />
      <form action={logout}>
        <Button
          variant="ghost"
          size="icon"
          type="submit"
          aria-label={t("auth.signOut")}
        >
          <LogOut className="size-4" />
        </Button>
      </form>
    </div>
  );

  return (
    <div className="min-h-dvh md:flex">
      {/* Sidebar — tablet/desktop */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
        <div className="border-b px-5 py-4">
          <p className="truncate font-semibold leading-tight">
            {session.nurseryName}
          </p>
          <p className="text-xs text-muted-foreground">{t("app.name")}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <MainNav isAdmin={isAdmin} variant="sidebar" />
        </div>
        <div className="space-y-3 border-t p-3">
          <div className="px-1">
            <p className="truncate text-sm font-medium">{session.fullName}</p>
            <p className="text-xs text-muted-foreground">
              {t(`roles.${session.role}`)}
            </p>
          </div>
          {controls}
        </div>
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col">
        {/* Top bar — mobile */}
        <header className="flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight">
              {session.nurseryName}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(`roles.${session.role}`)}
            </p>
          </div>
          {controls}
        </header>

        <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">{children}</main>

        {/* Bottom nav — mobile */}
        <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background/95 backdrop-blur md:hidden">
          <MainNav isAdmin={isAdmin} variant="bottom" />
        </nav>
      </div>
    </div>
  );
}
