"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { upsertPlantPrice } from "@/app/(app)/plants/actions";
import { suggestPrices, type PriceRules } from "@/lib/domain/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";

export type SizePrice = {
  sizeId: string;
  label: string;
  landedCost: number | null;
  minPrice: number | null;
  recommendedPrice: number | null;
  retailPrice: number | null;
};

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);

export function PricingEditor({
  plantId,
  rules,
  sizes,
}: {
  plantId: string;
  rules: PriceRules;
  sizes: SizePrice[];
}) {
  const t = useTranslations("pricing");
  if (sizes.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noSizes")}</p>;
  }
  return (
    <div className="space-y-3">
      {sizes.map((s) => (
        <PriceRow key={s.sizeId} plantId={plantId} rules={rules} size={s} />
      ))}
    </div>
  );
}

function PriceRow({
  plantId,
  rules,
  size,
}: {
  plantId: string;
  rules: PriceRules;
  size: SizePrice;
}) {
  const t = useTranslations("pricing");
  const [min, setMin] = useState(size.minPrice != null ? String(size.minPrice) : "");
  const [rec, setRec] = useState(
    size.recommendedPrice != null ? String(size.recommendedPrice) : "",
  );
  const [retail, setRetail] = useState(
    size.retailPrice != null ? String(size.retailPrice) : "",
  );

  function suggest() {
    if (size.landedCost == null) return;
    const s = suggestPrices(size.landedCost, rules);
    setMin(String(s.minPrice));
    setRec(String(s.recommendedPrice));
  }

  return (
    <form action={upsertPlantPrice} className="space-y-2 rounded-md border p-3">
      <input type="hidden" name="plant_id" value={plantId} />
      <input type="hidden" name="size_id" value={size.sizeId} />
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{size.label}</p>
        <p className="text-xs text-muted-foreground">
          {t("landed")}:{" "}
          <span className="tabular-nums">
            {size.landedCost != null ? inr(size.landedCost) : "—"}
          </span>
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs">{t("min")}</Label>
          <Input
            name="min_price"
            type="number"
            min="0"
            step="0.01"
            value={min}
            onChange={(e) => setMin(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("recommended")}</Label>
          <Input
            name="recommended_price"
            type="number"
            min="0"
            step="0.01"
            value={rec}
            onChange={(e) => setRec(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("retail")}</Label>
          <Input
            name="retail_price"
            type="number"
            min="0"
            step="0.01"
            value={retail}
            onChange={(e) => setRetail(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={suggest}
          disabled={size.landedCost == null}
        >
          <Sparkles className="size-4" />
          {t("suggest")}
        </Button>
        <Button type="submit" size="sm">
          {t("save")}
        </Button>
      </div>
    </form>
  );
}
