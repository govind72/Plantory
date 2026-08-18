import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { requireManager, accessibleOutlets } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { loadPlantsWithSizes } from "@/lib/plants";
import { LossForm } from "@/components/loss-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function LossPage() {
  const session = await requireManager();
  const supabase = await createClient();
  const t = await getTranslations("inventory.loss");
  const tInv = await getTranslations("inventory");
  const locale = await getLocale();

  const [outlets, plants] = await Promise.all([
    accessibleOutlets(session),
    loadPlantsWithSizes(supabase, locale),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/inventory"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      {outlets.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {tInv("noOutlets")}
        </p>
      ) : (
        <LossForm outlets={outlets} plants={plants} />
      )}
    </div>
  );
}
