"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  createOutlet,
  updateOutlet,
  type OutletState,
} from "@/app/(app)/settings/outlets/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

type Initial = {
  id?: string;
  name?: string;
  address?: string | null;
  phone?: string | null;
};
const initialState: OutletState = { status: "idle" };

export function OutletForm({
  mode,
  initial = {},
}: {
  mode: "create" | "edit";
  initial?: Initial;
}) {
  const t = useTranslations("outlets");
  const tf = useTranslations("outlets.fields");
  const action = mode === "create" ? createOutlet : updateOutlet;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {mode === "edit" && (
            <input type="hidden" name="outlet_id" value={initial.id} />
          )}
          <div className="space-y-2">
            <Label htmlFor="name">{tf("name")}</Label>
            <Input id="name" name="name" defaultValue={initial.name ?? ""} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">{tf("phone")}</Label>
              <Input id="phone" name="phone" defaultValue={initial.phone ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">{tf("address")}</Label>
              <Input
                id="address"
                name="address"
                defaultValue={initial.address ?? ""}
              />
            </div>
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
            {state.status === "error" && (
              <span className="text-sm text-destructive">{t("error")}</span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
