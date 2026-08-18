import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { deleteCategory } from "../actions";
import { AddCategoryForm } from "@/components/add-category-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Trash2 } from "lucide-react";

export default async function CategoriesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const t = await getTranslations("plants.cats");
  const tp = await getTranslations("plants");
  const locale = await getLocale();

  const { data: categories } = await supabase
    .from("plant_categories")
    .select("id, name_en, name_hi")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/plants"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        {tp("back")}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <AddCategoryForm />
          <div className="divide-y rounded-md border">
            {(categories ?? []).length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">{t("empty")}</p>
            ) : (
              (categories ?? []).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 p-3"
                >
                  <span className="text-sm">
                    {locale === "hi" && c.name_hi ? c.name_hi : c.name_en}
                    {c.name_hi && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {locale === "hi" ? c.name_en : c.name_hi}
                      </span>
                    )}
                  </span>
                  <form action={deleteCategory}>
                    <input type="hidden" name="category_id" value={c.id} />
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
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
