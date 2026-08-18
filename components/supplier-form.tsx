"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  createSupplier,
  updateSupplier,
  type SupplierState,
} from "@/app/(app)/suppliers/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

type Initial = {
  id?: string;
  name?: string;
  contact_person?: string | null;
  phone?: string | null;
  gstin?: string | null;
  address?: string | null;
  notes?: string | null;
};
const initialState: SupplierState = { status: "idle" };

export function SupplierForm({
  mode,
  initial = {},
}: {
  mode: "create" | "edit";
  initial?: Initial;
}) {
  const t = useTranslations("suppliers");
  const tf = useTranslations("suppliers.fields");
  const action = mode === "create" ? createSupplier : updateSupplier;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {mode === "edit" && (
            <input type="hidden" name="supplier_id" value={initial.id} />
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">{tf("name")}</Label>
              <Input id="name" name="name" defaultValue={initial.name ?? ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_person">{tf("contact")}</Label>
              <Input
                id="contact_person"
                name="contact_person"
                defaultValue={initial.contact_person ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{tf("phone")}</Label>
              <Input id="phone" name="phone" defaultValue={initial.phone ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstin">{tf("gstin")}</Label>
              <Input id="gstin" name="gstin" defaultValue={initial.gstin ?? ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">{tf("address")}</Label>
            <Input id="address" name="address" defaultValue={initial.address ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">{tf("notes")}</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              defaultValue={initial.notes ?? ""}
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
            {state.status === "error" && (
              <span className="text-sm text-destructive">{t("error")}</span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
