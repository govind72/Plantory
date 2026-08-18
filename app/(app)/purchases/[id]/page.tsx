import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { requireManager } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { allocateLandedCost } from "@/lib/domain/landed-cost";
import {
  removePurchaseItem,
  addPurchaseExpense,
  removePurchaseExpense,
} from "../actions";
import { AddPurchaseItemForm } from "@/components/add-purchase-item-form";
import { FinalizePurchaseButton } from "@/components/finalize-purchase-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowLeft, Trash2, Plus } from "lucide-react";

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireManager();
  const supabase = await createClient();
  const t = await getTranslations("purchases");
  const tItems = await getTranslations("purchases.items");
  const tExp = await getTranslations("purchases.expenses");
  const tSum = await getTranslations("purchases.summary");
  const tStatus = await getTranslations("purchases.status");
  const locale = await getLocale();

  const inr = (n: number) =>
    new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(n);

  const { data: purchase } = await supabase
    .from("purchases")
    .select(
      "id, status, purchase_date, truck_number, source_location, supplier_invoice_no, notes, landed_total, outlet:outlets(name), supplier:suppliers(name)",
    )
    .eq("id", id)
    .single();
  if (!purchase) notFound();

  const [{ data: items }, { data: expenses }] = await Promise.all([
    supabase
      .from("purchase_items")
      .select(
        "id, quantity, unit_cost, line_amount, landed_unit_cost, plant:plants(common_name_en, common_name_hi), size:plant_sizes(label)",
      )
      .eq("purchase_id", id)
      .order("created_at"),
    supabase
      .from("purchase_expenses")
      .select("id, label, amount")
      .eq("purchase_id", id)
      .order("created_at"),
  ]);

  const isDraft = purchase.status === "draft";
  const rows = items ?? [];
  const exp = expenses ?? [];

  const itemsSubtotal = rows.reduce((s, i) => s + Number(i.line_amount), 0);
  const expensesTotal = exp.reduce((s, e) => s + Number(e.amount), 0);

  const preview = allocateLandedCost(
    rows.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      unitCost: Number(i.unit_cost),
    })),
    expensesTotal,
  );
  const previewUnit = (itemId: string) =>
    preview.lines.find((l) => l.id === itemId)?.landedUnitCost ?? 0;

  const landedTotal = isDraft
    ? preview.landedTotal
    : Number(purchase.landed_total);

  const itemName = (i: (typeof rows)[number]) =>
    locale === "hi" && i.plant?.common_name_hi
      ? i.plant.common_name_hi
      : (i.plant?.common_name_en ?? "");

  // Plants (with sizes) for the add-item form — draft only.
  let plantsForForm: { id: string; name: string; sizes: { id: string; label: string }[] }[] =
    [];
  if (isDraft) {
    const { data: plants } = await supabase
      .from("plants")
      .select("id, common_name_en, common_name_hi, plant_sizes(id, label, active)")
      .eq("active", true)
      .order("common_name_en");
    plantsForForm = (plants ?? [])
      .map((p) => ({
        id: p.id,
        name:
          locale === "hi" && p.common_name_hi
            ? p.common_name_hi
            : p.common_name_en,
        sizes: (p.plant_sizes ?? [])
          .filter((s) => s.active)
          .map((s) => ({ id: s.id, label: s.label })),
      }))
      .filter((p) => p.sizes.length > 0);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/purchases"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">
              {purchase.supplier?.name ?? t("header.noSupplier")}
            </h1>
            <Badge variant={isDraft ? "secondary" : "default"}>
              {tStatus(purchase.status)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {[
              purchase.outlet?.name,
              purchase.purchase_date,
              purchase.truck_number,
              purchase.supplier_invoice_no,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>

      {!isDraft && (
        <p className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
          {t("finalizedNote")}
        </p>
      )}

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{tItems("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-2 font-medium">{tItems("plant")}</th>
                  <th className="py-2 pr-2 font-medium">{tItems("size")}</th>
                  <th className="py-2 pr-2 text-right font-medium">
                    {tItems("qty")}
                  </th>
                  <th className="py-2 pr-2 text-right font-medium">
                    {tItems("unitCost")}
                  </th>
                  <th className="py-2 pr-2 text-right font-medium">
                    {tItems("amount")}
                  </th>
                  <th className="py-2 pr-2 text-right font-medium">
                    {tItems("landedUnit")}
                  </th>
                  {isDraft && <th className="w-8" />}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isDraft ? 7 : 6}
                      className="py-4 text-center text-muted-foreground"
                    >
                      {tItems("empty")}
                    </td>
                  </tr>
                ) : (
                  rows.map((i) => (
                    <tr key={i.id} className="border-b last:border-0">
                      <td className="py-2 pr-2">{itemName(i)}</td>
                      <td className="py-2 pr-2 text-muted-foreground">
                        {i.size?.label}
                      </td>
                      <td className="py-2 pr-2 text-right tabular-nums">
                        {i.quantity}
                      </td>
                      <td className="py-2 pr-2 text-right tabular-nums">
                        {inr(Number(i.unit_cost))}
                      </td>
                      <td className="py-2 pr-2 text-right tabular-nums">
                        {inr(Number(i.line_amount))}
                      </td>
                      <td className="py-2 pr-2 text-right font-medium tabular-nums text-primary">
                        {inr(
                          isDraft
                            ? previewUnit(i.id)
                            : Number(i.landed_unit_cost),
                        )}
                      </td>
                      {isDraft && (
                        <td className="py-2 text-right">
                          <form action={removePurchaseItem}>
                            <input type="hidden" name="purchase_id" value={id} />
                            <input type="hidden" name="item_id" value={i.id} />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              aria-label={tItems("remove")}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </form>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {isDraft && plantsForForm.length > 0 && (
            <AddPurchaseItemForm purchaseId={id} plants={plantsForForm} />
          )}
        </CardContent>
      </Card>

      {/* Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{tExp("title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{tExp("subtitle")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="divide-y rounded-md border">
            {exp.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">
                {tExp("empty")}
              </p>
            ) : (
              exp.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-3 p-2.5 text-sm"
                >
                  <span>{e.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums">{inr(Number(e.amount))}</span>
                    {isDraft && (
                      <form action={removePurchaseExpense}>
                        <input type="hidden" name="purchase_id" value={id} />
                        <input type="hidden" name="expense_id" value={e.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label={tExp("remove")}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {isDraft && (
            <form
              action={addPurchaseExpense}
              className="grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end"
            >
              <input type="hidden" name="purchase_id" value={id} />
              <div className="space-y-1">
                <Label htmlFor="label">{tExp("label")}</Label>
                <Input id="label" name="label" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="amount">{tExp("amount")}</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              <Button type="submit" variant="outline">
                <Plus className="size-4" />
                {tExp("add")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{tSum("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{tSum("itemsSubtotal")}</dt>
              <dd className="tabular-nums">{inr(itemsSubtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{tSum("expensesTotal")}</dt>
              <dd className="tabular-nums">{inr(expensesTotal)}</dd>
            </div>
            <div className="flex justify-between border-t pt-1.5 font-semibold">
              <dt>{tSum("landedTotal")}</dt>
              <dd className="tabular-nums">{inr(landedTotal)}</dd>
            </div>
          </dl>
          {isDraft && (
            <FinalizePurchaseButton
              purchaseId={id}
              disabled={rows.length === 0}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
