import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireManager } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { SupplierForm } from "@/components/supplier-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireManager();
  const supabase = await createClient();
  const t = await getTranslations("suppliers");

  const { data: supplier } = await supabase
    .from("suppliers")
    .select("id, name, contact_person, phone, gstin, address, notes")
    .eq("id", id)
    .single();

  if (!supplier) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/suppliers"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>
      <h1 className="text-2xl font-semibold">{t("edit")}</h1>
      <SupplierForm mode="edit" initial={supplier} />
    </div>
  );
}
