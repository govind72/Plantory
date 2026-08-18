import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const session = await requireAdmin();
  const supabase = await createClient();

  const [{ data: org }, { data: settings }] = await Promise.all([
    supabase
      .from("organizations")
      .select("name, gst_enabled, gstin, whatsapp_number")
      .eq("id", session.organizationId)
      .single(),
    supabase
      .from("org_settings")
      .select(
        "cost_allocation_method, min_margin_pct, target_margin_pct, price_rounding_step, below_min_override_role",
      )
      .eq("organization_id", session.organizationId)
      .single(),
  ]);

  if (!org || !settings) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <SettingsForm org={org} settings={settings} />
    </div>
  );
}
