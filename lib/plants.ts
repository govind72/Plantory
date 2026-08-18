import "server-only";
import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export type PlantWithSizes = {
  id: string;
  name: string;
  sizes: { id: string; label: string }[];
};

/** Active plants that have at least one active size, names localized. */
export async function loadPlantsWithSizes(
  supabase: ServerClient,
  locale: string,
): Promise<PlantWithSizes[]> {
  const { data } = await supabase
    .from("plants")
    .select("id, common_name_en, common_name_hi, plant_sizes(id, label, active)")
    .eq("active", true)
    .order("common_name_en");

  return (data ?? [])
    .map((p) => ({
      id: p.id,
      name:
        locale === "hi" && p.common_name_hi ? p.common_name_hi : p.common_name_en,
      sizes: (p.plant_sizes ?? [])
        .filter((s) => s.active)
        .map((s) => ({ id: s.id, label: s.label })),
    }))
    .filter((p) => p.sizes.length > 0);
}
