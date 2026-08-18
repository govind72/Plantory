import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PlantForm } from "@/components/plant-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function NewPlantPage() {
  await requireAdmin();
  const supabase = await createClient();
  const t = await getTranslations("plants");
  const locale = await getLocale();

  const { data: categories } = await supabase
    .from("plant_categories")
    .select("id, name_en, name_hi")
    .eq("active", true)
    .order(locale === "hi" ? "name_hi" : "name_en");

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/plants"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>
      <h1 className="text-2xl font-semibold">{t("createTitle")}</h1>
      <PlantForm mode="create" categories={categories ?? []} />
    </div>
  );
}
