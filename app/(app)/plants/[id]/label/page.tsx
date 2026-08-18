/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getTranslations, getLocale } from "next-intl/server";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "@/components/print-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function PlantLabelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const t = await getTranslations("plants.qr");
  const tp = await getTranslations("plants");
  const locale = await getLocale();

  const { data: plant } = await supabase
    .from("plants")
    .select("common_name_en, common_name_hi, public_slug")
    .eq("id", id)
    .single();

  if (!plant) notFound();

  const name =
    locale === "hi" && plant.common_name_hi
      ? plant.common_name_hi
      : plant.common_name_en;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const publicUrl = `${appUrl}/p/${plant.public_slug}`;
  const qrDataUrl = await QRCode.toDataURL(publicUrl, {
    margin: 1,
    width: 640,
    errorCorrectionLevel: "M",
  });

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="flex items-center justify-between no-print">
        <Link
          href={`/plants/${id}/edit`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
        >
          <ArrowLeft className="size-4" />
          {tp("back")}
        </Link>
        <PrintButton label={t("print")} />
      </div>

      <div
        id="print-area"
        className="mx-auto flex max-w-xs flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center"
      >
        <p className="text-sm font-semibold tracking-wide text-primary">
          {session.nurseryName}
        </p>
        <img src={qrDataUrl} alt="QR" className="size-56" />
        <p className="text-lg font-semibold leading-tight">{name}</p>
        <p className="text-xs text-muted-foreground">{t("scanHint")}</p>
      </div>
    </div>
  );
}
