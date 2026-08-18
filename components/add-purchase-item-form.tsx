"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { addPurchaseItem } from "@/app/(app)/purchases/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Size = { id: string; label: string };
type Plant = { id: string; name: string; sizes: Size[] };

export function AddPurchaseItemForm({
  purchaseId,
  plants,
}: {
  purchaseId: string;
  plants: Plant[];
}) {
  const t = useTranslations("purchases.items");
  const [plantId, setPlantId] = useState("");
  const [sizeId, setSizeId] = useState("");

  const plant = plants.find((p) => p.id === plantId);
  const sizes = plant?.sizes ?? [];
  const plantName = plant?.name ?? t("selectPlant");
  const sizeName = sizes.find((s) => s.id === sizeId)?.label ?? t("selectSize");

  return (
    <form
      action={addPurchaseItem}
      className="grid gap-3 sm:grid-cols-[2fr_1.5fr_0.7fr_1fr_auto] sm:items-end"
    >
      <input type="hidden" name="purchase_id" value={purchaseId} />

      <div className="space-y-1">
        <Label>{t("plant")}</Label>
        <Select
          name="plant_id"
          value={plantId}
          onValueChange={(v) => {
            if (v) {
              setPlantId(v);
              setSizeId("");
            }
          }}
        >
          <SelectTrigger>
            <SelectValue>{plantName}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {plants.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>{t("size")}</Label>
        <Select
          name="size_id"
          value={sizeId}
          onValueChange={(v) => v && setSizeId(v)}
          disabled={!plant}
        >
          <SelectTrigger>
            <SelectValue>{sizeName}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {sizes.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="quantity">{t("qty")}</Label>
        <Input id="quantity" name="quantity" type="number" min="1" step="1" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="unit_cost">{t("unitCost")}</Label>
        <Input
          id="unit_cost"
          name="unit_cost"
          type="number"
          min="0"
          step="0.01"
          required
        />
      </div>
      <Button type="submit" disabled={!plantId || !sizeId}>
        {t("add")}
      </Button>
    </form>
  );
}
