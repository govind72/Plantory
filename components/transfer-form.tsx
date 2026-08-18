"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import {
  executeTransfer,
  type TransferState,
} from "@/app/(app)/inventory/actions";
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
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";

type Outlet = { id: string; name: string };
type Plant = { id: string; name: string; sizes: { id: string; label: string }[] };
type Row = {
  plantId: string;
  plantName: string;
  sizeId: string;
  sizeLabel: string;
  quantity: number;
};

const initial: TransferState = { status: "idle" };

export function TransferForm({
  outlets,
  plants,
}: {
  outlets: Outlet[];
  plants: Plant[];
}) {
  const t = useTranslations("inventory.transfer");
  const [state, action, pending] = useActionState(executeTransfer, initial);

  const [from, setFrom] = useState(outlets[0]?.id ?? "");
  const [to, setTo] = useState(outlets[1]?.id ?? "");
  const [rows, setRows] = useState<Row[]>([]);

  const [plantId, setPlantId] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [qty, setQty] = useState("");

  const plant = plants.find((p) => p.id === plantId);
  const sizes = plant?.sizes ?? [];
  const fromName = outlets.find((o) => o.id === from)?.name ?? "";
  const toName = outlets.find((o) => o.id === to)?.name ?? "";

  function addRow() {
    const n = Number(qty);
    if (!plantId || !sizeId || !n || n <= 0) return;
    const size = sizes.find((s) => s.id === sizeId);
    setRows([
      ...rows,
      {
        plantId,
        plantName: plant?.name ?? "",
        sizeId,
        sizeLabel: size?.label ?? "",
        quantity: n,
      },
    ]);
    setPlantId("");
    setSizeId("");
    setQty("");
  }

  const itemsJson = JSON.stringify(
    rows.map((r) => ({ plant_id: r.plantId, size_id: r.sizeId, quantity: r.quantity })),
  );
  const sameOutlet = from === to;

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="from_outlet" value={from} />
      <input type="hidden" name="to_outlet" value={to} />
      <input type="hidden" name="items" value={itemsJson} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("from")}</Label>
          <Select value={from} onValueChange={(v) => v && setFrom(v)}>
            <SelectTrigger>
              <SelectValue>{fromName}</SelectValue>
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
          <Label>{t("to")}</Label>
          <Select value={to} onValueChange={(v) => v && setTo(v)}>
            <SelectTrigger>
              <SelectValue>{toName}</SelectValue>
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
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[2fr_1.5fr_0.7fr_auto] sm:items-end">
            <div className="space-y-1">
              <Label>{t("plant")}</Label>
              <Select
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
            <div className="space-y-1">
              <Label>{t("size")}</Label>
              <Select
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
            <div className="space-y-1">
              <Label htmlFor="t_qty">{t("qty")}</Label>
              <Input
                id="t_qty"
                type="number"
                min="1"
                step="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={addRow}
              disabled={!plantId || !sizeId || !qty}
            >
              <Plus className="size-4" />
              {t("addItem")}
            </Button>
          </div>

          <div className="divide-y rounded-md border">
            {rows.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">{t("empty")}</p>
            ) : (
              rows.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 p-2.5 text-sm"
                >
                  <span>
                    {r.plantName} · {r.sizeLabel}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums">×{r.quantity}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label={t("remove")}
                      onClick={() => setRows(rows.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Button
          type="submit"
          disabled={pending || rows.length === 0 || sameOutlet}
        >
          {pending ? t("executing") : t("execute")}
        </Button>
        {sameOutlet && (
          <p className="text-sm text-destructive">{t("sameOutlet")}</p>
        )}
        {state.status === "error" && (
          <p className="text-sm text-destructive">{t("error")}</p>
        )}
      </div>
    </form>
  );
}
