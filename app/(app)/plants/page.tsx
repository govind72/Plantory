/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { publicImageUrl } from "@/lib/storage";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Leaf, Plus, FolderTree } from "lucide-react";

export default async function PlantsPage() {
  const session = await requireSession();
  const isAdmin = session.role === "owner" || session.role === "admin";
  const supabase = await createClient();
  const t = await getTranslations("plants");
  const locale = await getLocale();

  const { data: plants } = await supabase
    .from("plants")
    .select(
      "id, common_name_en, common_name_hi, active, category:plant_categories(name_en, name_hi), plant_images(storage_path, is_primary)",
    )
    .order("created_at", { ascending: false });

  const name = (p: { common_name_en: string; common_name_hi: string | null }) =>
    locale === "hi" && p.common_name_hi ? p.common_name_hi : p.common_name_en;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Link
              href="/plants/categories"
              className={buttonVariants({ variant: "outline" })}
            >
              <FolderTree className="size-4" />
              {t("categories")}
            </Link>
            <Link href="/plants/new" className={buttonVariants()}>
              <Plus className="size-4" />
              {t("new")}
            </Link>
          </div>
        )}
      </div>

      {!plants || plants.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {plants.map((p) => {
            const primary =
              p.plant_images.find((i) => i.is_primary) ?? p.plant_images[0];
            const card = (
              <div className="group overflow-hidden rounded-lg border bg-card transition-colors hover:border-primary/50">
                <div className="flex aspect-square items-center justify-center overflow-hidden bg-muted">
                  {primary ? (
                    <img
                      src={publicImageUrl(primary.storage_path)}
                      alt={name(p)}
                      className="size-full object-cover"
                    />
                  ) : (
                    <Leaf className="size-8 text-muted-foreground/40" />
                  )}
                </div>
                <div className="space-y-1 p-3">
                  <p className="truncate font-medium leading-tight">{name(p)}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-muted-foreground">
                      {p.category
                        ? locale === "hi" && p.category.name_hi
                          ? p.category.name_hi
                          : p.category.name_en
                        : t("uncategorized")}
                    </span>
                    {!p.active && (
                      <Badge variant="secondary" className="shrink-0">
                        {t("inactive")}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
            return isAdmin ? (
              <Link key={p.id} href={`/plants/${p.id}/edit`}>
                {card}
              </Link>
            ) : (
              <div key={p.id}>{card}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
