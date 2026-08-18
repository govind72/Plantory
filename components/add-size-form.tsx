"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { addSize } from "@/app/(app)/plants/actions";
import { composeSizeLabel } from "@/lib/domain/plant-size";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddSizeForm({ plantId }: { plantId: string }) {
  const t = useTranslations("plants.sizes");
  const [height, setHeight] = useState("");
  const [bag, setBag] = useState("");
  const [label, setLabel] = useState("");
  const [labelTouched, setLabelTouched] = useState(false);

  const auto = composeSizeLabel(height ? Number(height) : null, bag);
  const effectiveLabel = labelTouched ? label : auto;

  return (
    <form
      action={addSize}
      className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
    >
      <input type="hidden" name="plant_id" value={plantId} />
      <div className="space-y-1">
        <Label htmlFor="height_ft">{t("height")}</Label>
        <Input
          id="height_ft"
          name="height_ft"
          type="number"
          step="0.1"
          min="0"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="bag_size">{t("bag")}</Label>
        <Input
          id="bag_size"
          name="bag_size"
          value={bag}
          onChange={(e) => setBag(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="label">{t("label")}</Label>
        <Input
          id="label"
          name="label"
          value={effectiveLabel}
          onChange={(e) => {
            setLabelTouched(true);
            setLabel(e.target.value);
          }}
          required
        />
      </div>
      <Button type="submit">{t("add")}</Button>
    </form>
  );
}
