"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/auth/session";
import { provisionUserSchema } from "@/lib/validation/users";

export type ProvisionState = {
  status: "idle" | "ok" | "error" | "forbidden" | "emailInUse" | "roleForbidden";
};

export async function provisionUser(
  _prev: ProvisionState,
  formData: FormData,
): Promise<ProvisionState> {
  const session = await requireSession();
  if (session.role !== "owner" && session.role !== "admin") {
    return { status: "forbidden" };
  }

  const parsed = provisionUserSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    mobile: formData.get("mobile") ?? "",
    preferred_language: formData.get("preferred_language"),
    outlet_ids: formData.getAll("outlet_ids"),
  });
  if (!parsed.success) return { status: "error" };
  const v = parsed.data;

  // Admins cannot mint Owner/Admin accounts — only the Owner can.
  if (session.role === "admin" && (v.role === "owner" || v.role === "admin")) {
    return { status: "roleForbidden" };
  }

  const admin = createAdminClient();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: v.email,
    password: v.password,
    email_confirm: true,
    user_metadata: { full_name: v.full_name },
  });
  if (createErr || !created?.user) {
    const msg = createErr?.message?.toLowerCase() ?? "";
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
      return { status: "emailInUse" };
    }
    return { status: "error" };
  }
  const userId = created.user.id;

  const { error: profileErr } = await admin.from("profiles").insert({
    id: userId,
    organization_id: session.organizationId,
    full_name: v.full_name,
    mobile: v.mobile || null,
    role: v.role,
    preferred_language: v.preferred_language,
    active: true,
    created_by: session.userId,
  });
  if (profileErr) {
    // Don't orphan an auth user without a profile.
    await admin.auth.admin.deleteUser(userId);
    return { status: "error" };
  }

  if (v.outlet_ids.length > 0) {
    // Defense in depth: only assign outlets that belong to this org.
    const { data: validOutlets } = await admin
      .from("outlets")
      .select("id")
      .eq("organization_id", session.organizationId)
      .in("id", v.outlet_ids);
    const ids = (validOutlets ?? []).map((o) => o.id);
    if (ids.length > 0) {
      await admin.from("user_outlets").insert(
        ids.map((outlet_id) => ({
          organization_id: session.organizationId,
          user_id: userId,
          outlet_id,
        })),
      );
    }
  }

  revalidatePath("/users");
  return { status: "ok" };
}

/** Activate/deactivate a team member (Owner/Admin only). */
export async function setUserActive(formData: FormData): Promise<void> {
  const session = await requireSession();
  if (session.role !== "owner" && session.role !== "admin") return;

  const userId = String(formData.get("user_id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!userId || userId === session.userId) return; // never lock yourself out

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (!target) return;
  // Only an Owner may deactivate/activate another Owner.
  if (target.role === "owner" && session.role !== "owner") return;

  await supabase.from("profiles").update({ active }).eq("id", userId);
  revalidatePath("/users");
}
