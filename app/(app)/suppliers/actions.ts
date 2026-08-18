"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireManager } from "@/lib/auth/session";
import { supplierSchema } from "@/lib/validation/purchases";

export type SupplierState = { status: "idle" | "ok" | "error" };

function readSupplier(fd: FormData, orgId: string, createdBy?: string) {
  return {
    organization_id: orgId,
    name: String(fd.get("name") ?? "").trim(),
    contact_person: String(fd.get("contact_person") ?? "").trim() || null,
    phone: String(fd.get("phone") ?? "").trim() || null,
    gstin: String(fd.get("gstin") ?? "").trim() || null,
    address: String(fd.get("address") ?? "").trim() || null,
    notes: String(fd.get("notes") ?? "").trim() || null,
    ...(createdBy ? { created_by: createdBy } : {}),
  };
}

function validate(fd: FormData) {
  return supplierSchema.safeParse({
    name: fd.get("name"),
    contact_person: fd.get("contact_person") ?? "",
    phone: fd.get("phone") ?? "",
    gstin: fd.get("gstin") ?? "",
    address: fd.get("address") ?? "",
    notes: fd.get("notes") ?? "",
  });
}

export async function createSupplier(
  _prev: SupplierState,
  formData: FormData,
): Promise<SupplierState> {
  const session = await requireManager();
  if (!validate(formData).success) return { status: "error" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("suppliers")
    .insert(readSupplier(formData, session.organizationId, session.userId));
  if (error) return { status: "error" };
  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function updateSupplier(
  _prev: SupplierState,
  formData: FormData,
): Promise<SupplierState> {
  const session = await requireManager();
  const id = String(formData.get("supplier_id") ?? "");
  if (!id || !validate(formData).success) return { status: "error" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("suppliers")
    .update(readSupplier(formData, session.organizationId))
    .eq("id", id);
  if (error) return { status: "error" };
  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function deleteSupplier(formData: FormData): Promise<void> {
  await requireManager();
  const id = String(formData.get("supplier_id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("suppliers").delete().eq("id", id);
  revalidatePath("/suppliers");
}
