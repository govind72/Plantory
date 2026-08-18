import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { toggleOutletActive } from "./actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowLeft, Plus, Pencil } from "lucide-react";

export default async function OutletsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const t = await getTranslations("outlets");

  const { data: outlets } = await supabase
    .from("outlets")
    .select("id, name, address, active")
    .order("name");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/settings"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link href="/settings/outlets/new" className={buttonVariants()}>
          <Plus className="size-4" />
          {t("new")}
        </Link>
      </div>

      <div className="divide-y rounded-md border">
        {!outlets || outlets.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          outlets.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{o.name}</p>
                {o.address && (
                  <p className="truncate text-xs text-muted-foreground">
                    {o.address}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={o.active ? "default" : "secondary"}>
                  {o.active ? t("active") : t("inactive")}
                </Badge>
                <form action={toggleOutletActive}>
                  <input type="hidden" name="outlet_id" value={o.id} />
                  <input
                    type="hidden"
                    name="active"
                    value={o.active ? "false" : "true"}
                  />
                  <Button type="submit" variant="outline" size="sm">
                    {o.active ? t("deactivate") : t("activate")}
                  </Button>
                </form>
                <Link
                  href={`/settings/outlets/${o.id}/edit`}
                  className={buttonVariants({ variant: "ghost", size: "icon" })}
                  aria-label={t("edit")}
                >
                  <Pencil className="size-4" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
