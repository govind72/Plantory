"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/session";
import { outletSchema } from "@/lib/validation/outlets";

export type OutletState = { status: "idle" | "error" };

function read(fd: FormData) {
  return {
    name: String(fd.get("name") ?? "").trim(),
    address: String(fd.get("address") ?? "").trim() || null,
    phone: String(fd.get("phone") ?? "").trim() || null,
  };
}
function validate(fd: FormData) {
  return outletSchema.safeParse({
    name: fd.get("name"),
    address: fd.get("address") ?? "",
    phone: fd.get("phone") ?? "",
  });
}

export async function createOutlet(
  _prev: OutletState,
  formData: FormData,
): Promise<OutletState> {
  const session = await requireAdmin();
  if (!validate(formData).success) return { status: "error" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("outlets")
    .insert({ organization_id: session.organizationId, ...read(formData) });
  if (error) return { status: "error" };
  revalidatePath("/settings/outlets");
  redirect("/settings/outlets");
}

export async function updateOutlet(
  _prev: OutletState,
  formData: FormData,
): Promise<OutletState> {
  await requireAdmin();
  const id = String(formData.get("outlet_id") ?? "");
  if (!id || !validate(formData).success) return { status: "error" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("outlets")
    .update(read(formData))
    .eq("id", id);
  if (error) return { status: "error" };
  revalidatePath("/settings/outlets");
  redirect("/settings/outlets");
}

export async function toggleOutletActive(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("outlet_id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("outlets").update({ active }).eq("id", id);
  revalidatePath("/settings/outlets");
}
