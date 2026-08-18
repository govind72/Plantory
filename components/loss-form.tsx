"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { recordLoss, type LossState } from "@/app/(app)/inventory/actions";
import { lossReasons } from "@/lib/validation/inventory";
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

type Outlet = { id: string; name: string };
type Plant = { id: string; name: string; sizes: { id: string; label: string }[] };
const initial: LossState = { status: "idle" };

export function LossForm({
  outlets,
  plants,
}: {
  outlets: Outlet[];
  plants: Plant[];
}) {
  const t = useTranslations("inventory.loss");
  const tReasons = useTranslations("lossReasons");
  const [state, action, pending] = useActionState(recordLoss, initial);

  const [outlet, setOutlet] = useState(outlets[0]?.id ?? "");
  const [plantId, setPlantId] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [reason, setReason] = useState<string>("died");

  const plant = plants.find((p) => p.id === plantId);
  const sizes = plant?.sizes ?? [];

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
                  <SelectValue>
                    {outlets.find((o) => o.id === outlet)?.name ?? ""}
                  </SelectValue>
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
              <Label>{t("reason")}</Label>
              <Select
                name="reason"
                value={reason}
                onValueChange={(v) => v && setReason(v)}
              >
                <SelectTrigger>
                  <SelectValue>{tReasons(reason)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {lossReasons.map((r) => (
                    <SelectItem key={r} value={r}>
                      {tReasons(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
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
                  <SelectValue>{plant?.name ?? t("selectPlant")}</SelectValue>
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
            <div className="space-y-2">
              <Label>{t("size")}</Label>
              <Select
                name="size_id"
                value={sizeId}
                onValueChange={(v) => v && setSizeId(v)}
                disabled={!plant}
              >
                <SelectTrigger>
                  <SelectValue>
                    {sizes.find((s) => s.id === sizeId)?.label ?? t("selectSize")}
                  </SelectValue>
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
            <div className="space-y-2">
              <Label htmlFor="quantity">{t("qty")}</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                step="1"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">{t("note")}</Label>
            <Textarea id="note" name="note" rows={2} />
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={pending || !plantId || !sizeId}
              variant="destructive"
            >
              {pending ? t("recording") : t("record")}
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
