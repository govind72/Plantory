import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireManager } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { deleteSupplier } from "./actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default async function SuppliersPage() {
  await requireManager();
  const supabase = await createClient();
  const t = await getTranslations("suppliers");

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, name, contact_person, phone")
    .order("name");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link href="/suppliers/new" className={buttonVariants()}>
          <Plus className="size-4" />
          {t("new")}
        </Link>
      </div>

      <div className="divide-y rounded-md border">
        {!suppliers || suppliers.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          suppliers.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{s.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[s.contact_person, s.phone].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Link
                  href={`/suppliers/${s.id}/edit`}
                  className={buttonVariants({ variant: "ghost", size: "icon" })}
                  aria-label={t("edit")}
                >
                  <Pencil className="size-4" />
                </Link>
                <form action={deleteSupplier}>
                  <input type="hidden" name="supplier_id" value={s.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    aria-label={t("remove")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
