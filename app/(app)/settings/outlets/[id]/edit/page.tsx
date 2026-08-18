import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { OutletForm } from "@/components/outlet-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function EditOutletPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin();
  const supabase = await createClient();
  const t = await getTranslations("outlets");

  const { data: outlet } = await supabase
    .from("outlets")
    .select("id, name, address, phone")
    .eq("id", id)
    .single();

  if (!outlet) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/settings/outlets"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        {t("backList")}
      </Link>
      <h1 className="text-2xl font-semibold">{t("edit")}</h1>
      <OutletForm mode="edit" initial={outlet} />
    </div>
  );
}
