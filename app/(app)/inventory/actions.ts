"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireManager } from "@/lib/auth/session";
import { transferSchema, lossSchema } from "@/lib/validation/inventory";

export type TransferState = { status: "idle" | "error"; message?: string };
export type LossState = { status: "idle" | "error"; message?: string };

export async function executeTransfer(
  _prev: TransferState,
  formData: FormData,
): Promise<TransferState> {
  await requireManager();

  let items: unknown;
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { status: "error" };
  }

  const parsed = transferSchema.safeParse({
    from_outlet: formData.get("from_outlet"),
    to_outlet: formData.get("to_outlet"),
    note: formData.get("note") ?? "",
    items,
  });
  if (!parsed.success) return { status: "error" };
  const v = parsed.data;
  if (v.from_outlet === v.to_outlet) return { status: "error" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("transfer_stock", {
    p_from_outlet: v.from_outlet,
    p_to_outlet: v.to_outlet,
    p_items: v.items.map((i) => ({
      plant_id: i.plant_id,
      size_id: i.size_id,
      quantity: i.quantity,
    })),
    p_note: v.note || undefined,
  });
  if (error) return { status: "error", message: error.message };

  revalidatePath("/inventory");
  redirect(`/inventory?outlet=${v.to_outlet}`);
}

export async function recordLoss(
  _prev: LossState,
  formData: FormData,
): Promise<LossState> {
  await requireManager();
  const parsed = lossSchema.safeParse({
    outlet_id: formData.get("outlet_id"),
    plant_id: formData.get("plant_id"),
    size_id: formData.get("size_id"),
    quantity: formData.get("quantity"),
    reason: formData.get("reason"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { status: "error" };
  const v = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("record_loss", {
    p_outlet: v.outlet_id,
    p_plant: v.plant_id,
    p_size: v.size_id,
    p_qty: v.quantity,
    p_reason: v.reason,
    p_note: v.note || undefined,
  });
  if (error) return { status: "error", message: error.message };

  revalidatePath("/inventory");
  redirect(`/inventory?outlet=${v.outlet_id}`);
}
