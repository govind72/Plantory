import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { requireManager, accessibleOutlets } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function MovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ outlet?: string }>;
}) {
  const session = await requireManager();
  const supabase = await createClient();
  const t = await getTranslations("inventory.movements");
  const tTypes = await getTranslations("movementTypes");
  const locale = await getLocale();

  const outlets = await accessibleOutlets(session);
  const sp = await searchParams;
  const selected = outlets.find((o) => o.id === sp.outlet)?.id ?? outlets[0]?.id;

  const { data: moves } = selected
    ? await supabase
        .from("stock_movements")
        .select(
          "id, movement_type, quantity, unit_cost, created_at, reference_type, plant:plants(common_name_en, common_name_hi), size:plant_sizes(label)",
        )
        .eq("outlet_id", selected)
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: [] };

  const inr = (n: number) =>
    new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN", {
      style: "currency",
      currency: "INR",
    }).format(n);
  const dt = (s: string) =>
    new Date(s).toLocaleString(locale === "hi" ? "hi-IN" : "en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  const negative = (type: string) =>
    ["sale", "transfer_out", "mortality", "damage"].includes(type);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link
        href={`/inventory?outlet=${selected ?? ""}`}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      {outlets.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {outlets.map((o) => (
            <Link
              key={o.id}
              href={`/inventory/movements?outlet=${o.id}`}
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
              <th className="p-3 font-medium">{t("type")}</th>
              <th className="p-3 font-medium">{t("when")}</th>
              <th className="p-3 text-right font-medium">{t("qty")}</th>
              <th className="p-3 text-right font-medium">{t("cost")}</th>
            </tr>
          </thead>
          <tbody>
            {!moves || moves.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted-foreground">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              moves.map((m) => {
                const name =
                  locale === "hi" && m.plant?.common_name_hi
                    ? m.plant.common_name_hi
                    : (m.plant?.common_name_en ?? "");
                return (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="p-3">
                      <Badge variant="secondary" className="font-normal">
                        {tTypes(m.movement_type)}
                      </Badge>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {name}
                        {m.size?.label ? ` · ${m.size.label}` : ""}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {dt(m.created_at)}
                    </td>
                    <td
                      className={cn(
                        "p-3 text-right font-medium tabular-nums",
                        negative(m.movement_type) ? "text-destructive" : "text-primary",
                      )}
                    >
                      {negative(m.movement_type) ? "−" : "+"}
                      {m.quantity}
                    </td>
                    <td className="p-3 text-right tabular-nums text-muted-foreground">
                      {m.unit_cost != null ? inr(Number(m.unit_cost)) : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
