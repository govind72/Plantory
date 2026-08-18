"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";
import { orgSettingsSchema } from "@/lib/validation/settings";

export type SettingsState = {
  status: "idle" | "ok" | "error" | "forbidden";
};

export async function updateOrgSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const session = await requireSession();
  if (session.role !== "owner" && session.role !== "admin") {
    return { status: "forbidden" };
  }

  const parsed = orgSettingsSchema.safeParse({
    name: formData.get("name"),
    gst_enabled: formData.get("gst_enabled") === "on",
    gstin: formData.get("gstin") ?? "",
    whatsapp_number: formData.get("whatsapp_number") ?? "",
    cost_allocation_method: formData.get("cost_allocation_method"),
    min_margin_pct: formData.get("min_margin_pct"),
    target_margin_pct: formData.get("target_margin_pct"),
    price_rounding_step: formData.get("price_rounding_step"),
    below_min_override_role: formData.get("below_min_override_role"),
  });
  if (!parsed.success) return { status: "error" };
  const v = parsed.data;

  const supabase = await createClient();

  const { error: orgErr } = await supabase
    .from("organizations")
    .update({
      name: v.name,
      gst_enabled: v.gst_enabled,
      gstin: v.gstin || null,
      whatsapp_number: v.whatsapp_number || null,
    })
    .eq("id", session.organizationId);
  if (orgErr) return { status: "error" };

  const { error: setErr } = await supabase
    .from("org_settings")
    .update({
      cost_allocation_method: v.cost_allocation_method,
      min_margin_pct: v.min_margin_pct,
      target_margin_pct: v.target_margin_pct,
      price_rounding_step: v.price_rounding_step,
      below_min_override_role: v.below_min_override_role,
    })
    .eq("organization_id", session.organizationId);
  if (setErr) return { status: "error" };

  // Nursery name shows in the shell (root layout), so revalidate broadly.
  revalidatePath("/", "layout");
  return { status: "ok" };
}
