import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth/session";
import { OutletForm } from "@/components/outlet-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function NewOutletPage() {
  await requireAdmin();
  const t = await getTranslations("outlets");
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/settings/outlets"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        {t("backList")}
      </Link>
      <h1 className="text-2xl font-semibold">{t("new")}</h1>
      <OutletForm mode="create" />
    </div>
  );
}
