"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireManager } from "@/lib/auth/session";
import {
  purchaseHeaderSchema,
  purchaseItemSchema,
  purchaseExpenseSchema,
} from "@/lib/validation/purchases";
import { NONE_VALUE } from "@/lib/validation/plants";

export type PurchaseHeaderState = { status: "idle" | "error" };
export type FinalizeState = { status: "idle" | "error"; message?: string };

export async function createPurchase(
  _prev: PurchaseHeaderState,
  formData: FormData,
): Promise<PurchaseHeaderState> {
  const session = await requireManager();
  const rawSupplier = String(formData.get("supplier_id") ?? "");
  const parsed = purchaseHeaderSchema.safeParse({
    outlet_id: formData.get("outlet_id"),
    supplier_id: rawSupplier === NONE_VALUE ? "" : rawSupplier,
    supplier_invoice_no: formData.get("supplier_invoice_no") ?? "",
    purchase_date: formData.get("purchase_date") ?? "",
    truck_number: formData.get("truck_number") ?? "",
    source_location: formData.get("source_location") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return { status: "error" };
  const v = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchases")
    .insert({
      organization_id: session.organizationId,
      outlet_id: v.outlet_id,
      supplier_id: v.supplier_id || null,
      supplier_invoice_no: v.supplier_invoice_no || null,
      purchase_date: v.purchase_date || undefined,
      truck_number: v.truck_number || null,
      source_location: v.source_location || null,
      notes: v.notes || null,
      status: "draft",
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error || !data) return { status: "error" };
  redirect(`/purchases/${data.id}`);
}

/** Load a purchase's outlet + status, ensuring it is an editable draft. */
async function loadDraft(
  supabase: Awaited<ReturnType<typeof createClient>>,
  purchaseId: string,
) {
  const { data } = await supabase
    .from("purchases")
    .select("outlet_id, status")
    .eq("id", purchaseId)
    .single();
  if (!data || data.status !== "draft") return null;
  return data;
}

export async function addPurchaseItem(formData: FormData): Promise<void> {
  const session = await requireManager();
  const purchaseId = String(formData.get("purchase_id") ?? "");
  const parsed = purchaseItemSchema.safeParse({
    plant_id: formData.get("plant_id"),
    size_id: formData.get("size_id"),
    quantity: formData.get("quantity"),
    unit_cost: formData.get("unit_cost"),
  });
  if (!purchaseId || !parsed.success) return;
  const v = parsed.data;

  const supabase = await createClient();
  const draft = await loadDraft(supabase, purchaseId);
  if (!draft) return;

  await supabase.from("purchase_items").insert({
    organization_id: session.organizationId,
    outlet_id: draft.outlet_id,
    purchase_id: purchaseId,
    plant_id: v.plant_id,
    size_id: v.size_id,
    quantity: v.quantity,
    unit_cost: v.unit_cost,
    line_amount: Math.round(v.quantity * v.unit_cost * 100) / 100,
  });
  revalidatePath(`/purchases/${purchaseId}`);
}

export async function removePurchaseItem(formData: FormData): Promise<void> {
  await requireManager();
  const purchaseId = String(formData.get("purchase_id") ?? "");
  const itemId = String(formData.get("item_id") ?? "");
  if (!purchaseId || !itemId) return;
  const supabase = await createClient();
  if (!(await loadDraft(supabase, purchaseId))) return;
  await supabase.from("purchase_items").delete().eq("id", itemId);
  revalidatePath(`/purchases/${purchaseId}`);
}

export async function addPurchaseExpense(formData: FormData): Promise<void> {
  const session = await requireManager();
  const purchaseId = String(formData.get("purchase_id") ?? "");
  const parsed = purchaseExpenseSchema.safeParse({
    label: formData.get("label"),
    amount: formData.get("amount"),
  });
  if (!purchaseId || !parsed.success) return;

  const supabase = await createClient();
  const draft = await loadDraft(supabase, purchaseId);
  if (!draft) return;

  await supabase.from("purchase_expenses").insert({
    organization_id: session.organizationId,
    outlet_id: draft.outlet_id,
    purchase_id: purchaseId,
    label: parsed.data.label,
    amount: parsed.data.amount,
  });
  revalidatePath(`/purchases/${purchaseId}`);
}

export async function removePurchaseExpense(formData: FormData): Promise<void> {
  await requireManager();
  const purchaseId = String(formData.get("purchase_id") ?? "");
  const expenseId = String(formData.get("expense_id") ?? "");
  if (!purchaseId || !expenseId) return;
  const supabase = await createClient();
  if (!(await loadDraft(supabase, purchaseId))) return;
  await supabase.from("purchase_expenses").delete().eq("id", expenseId);
  revalidatePath(`/purchases/${purchaseId}`);
}

export async function finalizePurchase(
  _prev: FinalizeState,
  formData: FormData,
): Promise<FinalizeState> {
  await requireManager();
  const purchaseId = String(formData.get("purchase_id") ?? "");
  if (!purchaseId) return { status: "error" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("finalize_purchase", {
    p_purchase_id: purchaseId,
  });
  if (error) return { status: "error", message: error.message };

  revalidatePath(`/purchases/${purchaseId}`);
  revalidatePath("/purchases");
  redirect(`/purchases/${purchaseId}`);
}
