import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireManager } from "@/lib/auth/session";
import { SupplierForm } from "@/components/supplier-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function NewSupplierPage() {
  await requireManager();
  const t = await getTranslations("suppliers");
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/suppliers"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>
      <h1 className="text-2xl font-semibold">{t("new")}</h1>
      <SupplierForm mode="create" />
    </div>
  );
}
