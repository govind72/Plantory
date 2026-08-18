"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import {
  createPurchase,
  type PurchaseHeaderState,
} from "@/app/(app)/purchases/actions";
import { NONE_VALUE } from "@/lib/validation/plants";
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
import { Card, CardContent } from "@/components/ui/card";

type Opt = { id: string; name: string };
const initial: PurchaseHeaderState = { status: "idle" };

export function PurchaseHeaderForm({
  outlets,
  suppliers,
}: {
  outlets: Opt[];
  suppliers: Opt[];
}) {
  const t = useTranslations("purchases.header");
  const [state, action, pending] = useActionState(createPurchase, initial);
  const [outlet, setOutlet] = useState(outlets[0]?.id ?? "");
  const [supplier, setSupplier] = useState(NONE_VALUE);
  const today = new Date().toISOString().slice(0, 10);

  const outletName = outlets.find((o) => o.id === outlet)?.name ?? "";
  const supplierName =
    supplier === NONE_VALUE
      ? t("noSupplier")
      : (suppliers.find((s) => s.id === supplier)?.name ?? t("noSupplier"));

  return (
    <Card>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("outlet")}</Label>
              <Select
                name="outlet_id"
                value={outlet}
                onValueChange={(v) => v && setOutlet(v)}
              >
                <SelectTrigger>
                  <SelectValue>{outletName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {outlets.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("supplier")}</Label>
              <Select
                name="supplier_id"
                value={supplier}
                onValueChange={(v) => v && setSupplier(v)}
              >
                <SelectTrigger>
                  <SelectValue>{supplierName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>{t("noSupplier")}</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase_date">{t("date")}</Label>
              <Input
                id="purchase_date"
                name="purchase_date"
                type="date"
                defaultValue={today}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier_invoice_no">{t("invoiceNo")}</Label>
              <Input id="supplier_invoice_no" name="supplier_invoice_no" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="truck_number">{t("truck")}</Label>
              <Input id="truck_number" name="truck_number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source_location">{t("source")}</Label>
              <Input id="source_location" name="source_location" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">{t("notes")}</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending || !outlet}>
              {pending ? t("creating") : t("create")}
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
