import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { requireManager } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Plus } from "lucide-react";

const inr = (n: number, locale: string) =>
  new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);

export default async function PurchasesPage() {
  await requireManager();
  const supabase = await createClient();
  const t = await getTranslations("purchases");
  const tStatus = await getTranslations("purchases.status");
  const locale = await getLocale();

  const { data: purchases } = await supabase
    .from("purchases")
    .select(
      "id, purchase_date, status, items_subtotal, landed_total, truck_number, supplier:suppliers(name)",
    )
    .order("purchase_date", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link href="/purchases/new" className={buttonVariants()}>
          <Plus className="size-4" />
          {t("new")}
        </Link>
      </div>

      <div className="divide-y rounded-md border">
        {!purchases || purchases.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          purchases.map((p) => (
            <Link
              key={p.id}
              href={`/purchases/${p.id}`}
              className="flex items-center justify-between gap-3 p-3 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {p.supplier?.name ?? t("header.noSupplier")}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.purchase_date}
                  {p.truck_number ? ` · ${p.truck_number}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-medium tabular-nums">
                  {inr(
                    Number(
                      p.status === "finalized"
                        ? p.landed_total
                        : p.items_subtotal,
                    ),
                    locale,
                  )}
                </span>
                <Badge
                  variant={p.status === "finalized" ? "default" : "secondary"}
                >
                  {tStatus(p.status)}
                </Badge>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
