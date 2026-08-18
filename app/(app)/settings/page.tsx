import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings-form";
import { Store, ChevronRight } from "lucide-react";

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

  const tOutlets = await getTranslations("outlets");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <SettingsForm org={org} settings={settings} />
      <Link
        href="/settings/outlets"
        className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/50"
      >
        <div className="flex items-center gap-3">
          <Store className="size-5 text-primary" />
          <div>
            <p className="font-medium">{tOutlets("manage")}</p>
            <p className="text-sm text-muted-foreground">
              {tOutlets("subtitle")}
            </p>
          </div>
        </div>
        <ChevronRight className="size-5 text-muted-foreground" />
      </Link>
    </div>
  );
}
