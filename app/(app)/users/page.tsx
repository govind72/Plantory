import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AddUserForm } from "@/components/add-user-form";
import { setUserActive } from "./actions";
import { Button } from "@/components/ui/button";

export default async function UsersPage() {
  const session = await requireAdmin();
  const supabase = await createClient();
  const t = await getTranslations("users");
  const tRoles = await getTranslations("roles");

  const [{ data: members }, { data: outlets }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role, active, user_outlets!user_id(outlets(name))")
      .order("created_at"),
    supabase
      .from("outlets")
      .select("id, name")
      .eq("active", true)
      .order("name"),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <AddUserForm
        outlets={outlets ?? []}
        canCreatePrivileged={session.role === "owner"}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-medium">{t("existing")}</h2>
        <div className="divide-y rounded-md border">
          {(members ?? []).map((m) => {
            const outletNames = (m.user_outlets ?? [])
              .map((uo) => uo.outlets?.name)
              .filter((n): n is string => Boolean(n));
            const spansAll = m.role === "owner" || m.role === "admin";
            const isSelf = m.id === session.userId;
            return (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {m.full_name}
                    {isSelf && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({t("you")})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tRoles(m.role)} ·{" "}
                    {spansAll
                      ? t("noOutlets")
                      : outletNames.length > 0
                        ? outletNames.join(", ")
                        : "—"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-xs " +
                      (m.active
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground")
                    }
                  >
                    {m.active ? t("active") : t("inactive")}
                  </span>
                  {!isSelf && (
                    <form action={setUserActive}>
                      <input type="hidden" name="user_id" value={m.id} />
                      <input
                        type="hidden"
                        name="active"
                        value={m.active ? "false" : "true"}
                      />
                      <Button type="submit" variant="outline" size="sm">
                        {m.active ? t("deactivate") : t("activate")}
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
