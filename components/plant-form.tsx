"use client";

import { useActionState, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  createPlant,
  updatePlant,
  type PlantFormState,
} from "@/app/(app)/plants/actions";
import {
  sunlightOptions,
  waterOptions,
  placementOptions,
  NONE_VALUE,
} from "@/lib/validation/plants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Category = { id: string; name_en: string; name_hi: string | null };
export type PlantInitial = {
  id?: string;
  common_name_en?: string;
  common_name_hi?: string | null;
  scientific_name?: string | null;
  local_name?: string | null;
  category_id?: string | null;
  variety?: string | null;
  unit?: string | null;
  description_en?: string | null;
  description_hi?: string | null;
  care_en?: string | null;
  care_hi?: string | null;
  sunlight?: string | null;
  water?: string | null;
  placement?: string | null;
};

const initialState: PlantFormState = { status: "idle" };

export function PlantForm({
  mode,
  categories,
  initial = {},
}: {
  mode: "create" | "edit";
  categories: Category[];
  initial?: PlantInitial;
}) {
  const t = useTranslations("plants");
  const tf = useTranslations("plants.fields");
  const tAttr = useTranslations("plantAttrs");
  const locale = useLocale();
  const action = mode === "create" ? createPlant : updatePlant;
  const [state, formAction, pending] = useActionState(action, initialState);

  const [category, setCategory] = useState(initial.category_id ?? NONE_VALUE);
  const [sunlight, setSunlight] = useState(initial.sunlight ?? NONE_VALUE);
  const [water, setWater] = useState(initial.water ?? NONE_VALUE);
  const [placement, setPlacement] = useState(initial.placement ?? NONE_VALUE);

  const catLabel = (c: Category) =>
    locale === "hi" && c.name_hi ? c.name_hi : c.name_en;
  const currentCatLabel =
    category === NONE_VALUE
      ? tf("none")
      : (() => {
          const c = categories.find((x) => x.id === category);
          return c ? catLabel(c) : tf("none");
        })();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("details")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {mode === "edit" && (
            <input type="hidden" name="plant_id" value={initial.id} />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              name="common_name_en"
              label={tf("commonNameEn")}
              defaultValue={initial.common_name_en ?? ""}
              required
            />
            <Field
              name="common_name_hi"
              label={tf("commonNameHi")}
              defaultValue={initial.common_name_hi ?? ""}
            />
            <Field
              name="scientific_name"
              label={tf("scientificName")}
              defaultValue={initial.scientific_name ?? ""}
            />
            <Field
              name="local_name"
              label={tf("localName")}
              defaultValue={initial.local_name ?? ""}
            />

            <div className="space-y-2">
              <Label>{tf("category")}</Label>
              <Select
                name="category_id"
                value={category}
                onValueChange={(v) => v && setCategory(v)}
              >
                <SelectTrigger>
                  <SelectValue>{currentCatLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>{tf("none")}</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {catLabel(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Field
              name="variety"
              label={tf("variety")}
              defaultValue={initial.variety ?? ""}
            />

            <EnumSelect
              name="sunlight"
              label={tf("sunlight")}
              value={sunlight}
              onChange={setSunlight}
              options={sunlightOptions}
              labelFor={(o) => tAttr(`sunlight.${o}`)}
              noneLabel={tf("none")}
            />
            <EnumSelect
              name="water"
              label={tf("water")}
              value={water}
              onChange={setWater}
              options={waterOptions}
              labelFor={(o) => tAttr(`water.${o}`)}
              noneLabel={tf("none")}
            />
            <EnumSelect
              name="placement"
              label={tf("placement")}
              value={placement}
              onChange={setPlacement}
              options={placementOptions}
              labelFor={(o) => tAttr(`placement.${o}`)}
              noneLabel={tf("none")}
            />
            <Field
              name="unit"
              label={tf("unit")}
              defaultValue={initial.unit ?? "piece"}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name="description_en"
              label={tf("descriptionEn")}
              defaultValue={initial.description_en ?? ""}
            />
            <TextField
              name="description_hi"
              label={tf("descriptionHi")}
              defaultValue={initial.description_hi ?? ""}
            />
            <TextField
              name="care_en"
              label={tf("careEn")}
              defaultValue={initial.care_en ?? ""}
            />
            <TextField
              name="care_hi"
              label={tf("careHi")}
              defaultValue={initial.care_hi ?? ""}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending
                ? mode === "create"
                  ? t("creating")
                  : t("saving")
                : mode === "create"
                  ? t("create")
                  : t("save")}
            </Button>
            {state.status === "ok" && (
              <span className="text-sm text-primary">{t("saved")}</span>
            )}
            {state.status === "error" && (
              <span className="text-sm text-destructive">{t("error")}</span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  name,
  label,
  defaultValue,
  required,
}: {
  name: string;
  label: string;
  defaultValue: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} required={required} />
    </div>
  );
}

function TextField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} defaultValue={defaultValue} rows={3} />
    </div>
  );
}

function EnumSelect({
  name,
  label,
  value,
  onChange,
  options,
  labelFor,
  noneLabel,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  labelFor: (o: string) => string;
  noneLabel: string;
}) {
  const display = value === NONE_VALUE ? noneLabel : labelFor(value);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select name={name} value={value} onValueChange={(v) => v && onChange(v)}>
        <SelectTrigger>
          <SelectValue>{display}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>{noneLabel}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {labelFor(o)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
