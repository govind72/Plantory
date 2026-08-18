import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { requireSession, accessibleOutlets } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeftRight, TriangleAlert, History } from "lucide-react";

type StockRow = {
  plantName: string;
  sizeLabel: string;
  qty: number;
  value: number | null;
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ outlet?: string }>;
}) {
  const session = await requireSession();
  const isManager =
    session.role === "owner" ||
    session.role === "admin" ||
    session.role === "outlet_manager";
  const supabase = await createClient();
  const t = await getTranslations("inventory");
  const locale = await getLocale();

  const outlets = await accessibleOutlets(session);
  const sp = await searchParams;
  const selected = outlets.find((o) => o.id === sp.outlet)?.id ?? outlets[0]?.id;

  const inr = (n: number) =>
    new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);

  let rows: StockRow[] = [];
  let totalValue = 0;

  if (selected) {
    if (isManager) {
      const { data } = await supabase
        .from("inventory_batches")
        .select(
          "qty_remaining, landed_unit_cost, plant_id, plant:plants(common_name_en, common_name_hi), size:plant_sizes(label)",
        )
        .eq("outlet_id", selected)
        .gt("qty_remaining", 0);
      const map = new Map<string, StockRow>();
      for (const b of data ?? []) {
        const label = b.size?.label ?? "";
        const key = `${b.plant_id}|${label}`;
        const name =
          locale === "hi" && b.plant?.common_name_hi
            ? b.plant.common_name_hi
            : (b.plant?.common_name_en ?? "");
        const val = b.qty_remaining * Number(b.landed_unit_cost);
        const cur =
          map.get(key) ??
          ({ plantName: name, sizeLabel: label, qty: 0, value: 0 } as StockRow);
        cur.qty += b.qty_remaining;
        cur.value = (cur.value ?? 0) + val;
        map.set(key, cur);
      }
      rows = [...map.values()].sort((a, b) => a.plantName.localeCompare(b.plantName));
      totalValue = rows.reduce((s, r) => s + (r.value ?? 0), 0);
    } else {
      const { data } = await supabase.rpc("get_outlet_stock", {
        p_outlet: selected,
      });
      const stock = (data ?? []) as {
        plant_id: string;
        size_label: string;
        qty_available: number;
      }[];
      const ids = [...new Set(stock.map((r) => r.plant_id))];
      const { data: plants } = ids.length
        ? await supabase
            .from("plants")
            .select("id, common_name_en, common_name_hi")
            .in("id", ids)
        : { data: [] };
      const nameMap = new Map(
        (plants ?? []).map((p) => [
          p.id,
          locale === "hi" && p.common_name_hi
            ? p.common_name_hi
            : p.common_name_en,
        ]),
      );
      rows = stock
        .map((r) => ({
          plantName: nameMap.get(r.plant_id) ?? "",
          sizeLabel: r.size_label,
          qty: Number(r.qty_available),
          value: null,
        }))
        .sort((a, b) => a.plantName.localeCompare(b.plantName));
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        {isManager && selected && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/inventory/movements?outlet=${selected}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <History className="size-4" />
              {t("actions.movements")}
            </Link>
            <Link
              href="/inventory/loss"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <TriangleAlert className="size-4" />
              {t("actions.recordLoss")}
            </Link>
            {outlets.length > 1 && (
              <Link
                href="/inventory/transfer"
                className={buttonVariants({ size: "sm" })}
              >
                <ArrowLeftRight className="size-4" />
                {t("actions.transfer")}
              </Link>
            )}
          </div>
        )}
      </div>

      {outlets.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("noOutlets")}
        </p>
      ) : (
        <>
          {outlets.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {outlets.map((o) => (
                <Link
                  key={o.id}
                  href={`/inventory?outlet=${o.id}`}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm",
                    o.id === selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {o.name}
                </Link>
              ))}
            </div>
          )}

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="p-3 font-medium">{t("plant")}</th>
                  <th className="p-3 font-medium">{t("size")}</th>
                  <th className="p-3 text-right font-medium">{t("qty")}</th>
                  {isManager && (
                    <th className="p-3 text-right font-medium">{t("value")}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isManager ? 4 : 3}
                      className="p-6 text-center text-muted-foreground"
                    >
                      {t("empty")}
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-3 font-medium">{r.plantName}</td>
                      <td className="p-3 text-muted-foreground">{r.sizeLabel}</td>
                      <td className="p-3 text-right tabular-nums">{r.qty}</td>
                      {isManager && (
                        <td className="p-3 text-right tabular-nums">
                          {inr(r.value ?? 0)}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
              {isManager && rows.length > 0 && (
                <tfoot>
                  <tr className="border-t font-semibold">
                    <td className="p-3" colSpan={3}>
                      {t("totalValue")}
                    </td>
                    <td className="p-3 text-right tabular-nums">
                      {inr(totalValue)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}
    </div>
  );
}
