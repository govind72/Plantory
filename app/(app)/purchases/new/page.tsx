import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireManager, accessibleOutlets } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PurchaseHeaderForm } from "@/components/purchase-header-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function NewPurchasePage() {
  const session = await requireManager();
  const supabase = await createClient();
  const t = await getTranslations("purchases");

  const [outlets, { data: suppliers }] = await Promise.all([
    accessibleOutlets(session),
    supabase.from("suppliers").select("id, name").order("name"),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/purchases"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>
      <h1 className="text-2xl font-semibold">{t("new")}</h1>
      <PurchaseHeaderForm outlets={outlets} suppliers={suppliers ?? []} />
    </div>
  );
}
