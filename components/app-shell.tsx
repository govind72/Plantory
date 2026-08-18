import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { logout } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import type { SessionContext } from "@/lib/auth/session";

/**
 * Minimal authenticated shell for M2 (dynamic nursery name + user + sign out).
 * The full responsive navigation (bottom nav / sidebar) is built in M3.
 */
export function AppShell({
  session,
  children,
}: {
  session: SessionContext;
  children: ReactNode;
}) {
  const t = useTranslations();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="font-semibold leading-tight">{session.nurseryName}</p>
          <p className="text-xs text-muted-foreground">{t("app.name")}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right leading-tight">
            <p className="text-sm font-medium">{session.fullName}</p>
            <p className="text-xs text-muted-foreground">
              {t(`roles.${session.role}`)}
            </p>
          </div>
          <form action={logout}>
            <Button variant="outline" size="sm" type="submit">
              {t("auth.signOut")}
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
