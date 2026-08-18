"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import {
  updateOrgSettings,
  type SettingsState,
} from "@/app/(app)/settings/actions";
import {
  costAllocationMethods,
  userRoles,
} from "@/lib/validation/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

type OrgRow = {
  name: string;
  gst_enabled: boolean;
  gstin: string | null;
  whatsapp_number: string | null;
};
type SettingsRow = {
  cost_allocation_method: string;
  min_margin_pct: number;
  target_margin_pct: number;
  price_rounding_step: number;
  below_min_override_role: string;
};

const initial: SettingsState = { status: "idle" };

export function SettingsForm({
  org,
  settings,
}: {
  org: OrgRow;
  settings: SettingsRow;
}) {
  const t = useTranslations("settings");
  const tAlloc = useTranslations("allocation");
  const tRoles = useTranslations("roles");
  const [state, action, pending] = useActionState(updateOrgSettings, initial);
  const [alloc, setAlloc] = useState<string>(settings.cost_allocation_method);
  const [overrideRole, setOverrideRole] = useState<string>(
    settings.below_min_override_role,
  );

  return (
    <form action={action} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("subtitle", { nursery: org.name })}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("identity")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("nurseryName")}</Label>
            <Input id="name" name="name" defaultValue={org.name} required />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="gst_enabled">{t("gstEnabled")}</Label>
            <Switch
              id="gst_enabled"
              name="gst_enabled"
              defaultChecked={org.gst_enabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gstin">{t("gstin")}</Label>
            <Input id="gstin" name="gstin" defaultValue={org.gstin ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp_number">{t("whatsappNumber")}</Label>
            <Input
              id="whatsapp_number"
              name="whatsapp_number"
              inputMode="numeric"
              defaultValue={org.whatsapp_number ?? ""}
            />
            <p className="text-xs text-muted-foreground">{t("whatsappHint")}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("pricing")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("costAllocation")}</Label>
            <Select
              name="cost_allocation_method"
              value={alloc}
              onValueChange={(v) => {
                if (v) setAlloc(v);
              }}
            >
              <SelectTrigger>
                <SelectValue>{tAlloc(alloc)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {costAllocationMethods.map((m) => (
                  <SelectItem key={m} value={m}>
                    {tAlloc(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_margin_pct">{t("minMargin")}</Label>
              <Input
                id="min_margin_pct"
                name="min_margin_pct"
                type="number"
                step="0.01"
                defaultValue={String(settings.min_margin_pct)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_margin_pct">{t("targetMargin")}</Label>
              <Input
                id="target_margin_pct"
                name="target_margin_pct"
                type="number"
                step="0.01"
                defaultValue={String(settings.target_margin_pct)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price_rounding_step">{t("rounding")}</Label>
            <Input
              id="price_rounding_step"
              name="price_rounding_step"
              type="number"
              step="0.01"
              defaultValue={String(settings.price_rounding_step)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("overrideRole")}</Label>
            <Select
              name="below_min_override_role"
              value={overrideRole}
              onValueChange={(v) => {
                if (v) setOverrideRole(v);
              }}
            >
              <SelectTrigger>
                <SelectValue>{tRoles(overrideRole)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {userRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {tRoles(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? t("saving") : t("save")}
        </Button>
        {state.status === "ok" && (
          <span className="text-sm text-green-600">{t("saved")}</span>
        )}
        {state.status === "error" && (
          <span className="text-sm text-destructive">{t("error")}</span>
        )}
        {state.status === "forbidden" && (
          <span className="text-sm text-destructive">{t("forbidden")}</span>
        )}
      </div>
    </form>
  );
}
