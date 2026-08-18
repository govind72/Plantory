"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/session";
import {
  categorySchema,
  plantSchema,
  sizeSchema,
  NONE_VALUE,
} from "@/lib/validation/plants";
import { priceSchema } from "@/lib/validation/pricing";

const norm = (x: FormDataEntryValue | null): string => {
  const s = String(x ?? "").trim();
  return s === NONE_VALUE ? "" : s;
};

// ---- categories -----------------------------------------------------------
export type CategoryState = { status: "idle" | "ok" | "error" };

export async function createCategory(
  _prev: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const session = await requireAdmin();
  const parsed = categorySchema.safeParse({
    name_en: formData.get("name_en"),
    name_hi: formData.get("name_hi") ?? "",
  });
  if (!parsed.success) return { status: "error" };

  const supabase = await createClient();
  const { error } = await supabase.from("plant_categories").insert({
    organization_id: session.organizationId,
    name_en: parsed.data.name_en,
    name_hi: parsed.data.name_hi || null,
    created_by: session.userId,
  });
  if (error) return { status: "error" };
  revalidatePath("/plants/categories");
  return { status: "ok" };
}

export async function deleteCategory(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("category_id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("plant_categories").delete().eq("id", id);
  revalidatePath("/plants/categories");
}

// ---- plants ---------------------------------------------------------------
export type PlantFormState = { status: "idle" | "ok" | "error" };

function readPlantFields(fd: FormData, orgId: string, createdBy?: string) {
  return {
    organization_id: orgId,
    common_name_en: String(fd.get("common_name_en") ?? "").trim(),
    common_name_hi: norm(fd.get("common_name_hi")) || null,
    scientific_name: norm(fd.get("scientific_name")) || null,
    local_name: norm(fd.get("local_name")) || null,
    category_id: norm(fd.get("category_id")) || null,
    variety: norm(fd.get("variety")) || null,
    description_en: norm(fd.get("description_en")) || null,
    description_hi: norm(fd.get("description_hi")) || null,
    care_en: norm(fd.get("care_en")) || null,
    care_hi: norm(fd.get("care_hi")) || null,
    sunlight: (norm(fd.get("sunlight")) || null) as
      | "full_sun"
      | "partial_shade"
      | "full_shade"
      | null,
    water: (norm(fd.get("water")) || null) as "low" | "medium" | "high" | null,
    placement: (norm(fd.get("placement")) || null) as
      | "indoor"
      | "outdoor"
      | "both"
      | null,
    unit: String(fd.get("unit") || "piece").trim(),
    ...(createdBy ? { created_by: createdBy } : {}),
  };
}

function validatePlant(fd: FormData) {
  return plantSchema.safeParse({
    common_name_en: fd.get("common_name_en"),
    common_name_hi: norm(fd.get("common_name_hi")),
    scientific_name: norm(fd.get("scientific_name")),
    local_name: norm(fd.get("local_name")),
    category_id: norm(fd.get("category_id")),
    variety: norm(fd.get("variety")),
    description_en: norm(fd.get("description_en")),
    description_hi: norm(fd.get("description_hi")),
    care_en: norm(fd.get("care_en")),
    care_hi: norm(fd.get("care_hi")),
    sunlight: norm(fd.get("sunlight")),
    water: norm(fd.get("water")),
    placement: norm(fd.get("placement")),
    unit: fd.get("unit") || "piece",
  });
}

export async function createPlant(
  _prev: PlantFormState,
  formData: FormData,
): Promise<PlantFormState> {
  const session = await requireAdmin();
  if (!validatePlant(formData).success) return { status: "error" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plants")
    .insert(readPlantFields(formData, session.organizationId, session.userId))
    .select("id")
    .single();
  if (error || !data) return { status: "error" };
  redirect(`/plants/${data.id}/edit`);
}

export async function updatePlant(
  _prev: PlantFormState,
  formData: FormData,
): Promise<PlantFormState> {
  const session = await requireAdmin();
  const id = String(formData.get("plant_id") ?? "");
  if (!id || !validatePlant(formData).success) return { status: "error" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("plants")
    .update(readPlantFields(formData, session.organizationId))
    .eq("id", id);
  if (error) return { status: "error" };
  revalidatePath(`/plants/${id}/edit`);
  revalidatePath("/plants");
  return { status: "ok" };
}

export async function togglePlantActive(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("plant_id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("plants").update({ active }).eq("id", id);
  revalidatePath("/plants");
  revalidatePath(`/plants/${id}/edit`);
}

// ---- sizes ----------------------------------------------------------------
export async function addSize(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const plantId = String(formData.get("plant_id") ?? "");
  const parsed = sizeSchema.safeParse({
    height_ft: formData.get("height_ft") ?? "",
    bag_size: formData.get("bag_size") ?? "",
    label: formData.get("label"),
  });
  if (!plantId || !parsed.success) return;
  const v = parsed.data;

  const supabase = await createClient();
  await supabase.from("plant_sizes").insert({
    organization_id: session.organizationId,
    plant_id: plantId,
    height_ft: v.height_ft === "" || v.height_ft == null ? null : v.height_ft,
    bag_size: v.bag_size || null,
    label: v.label,
  });
  revalidatePath(`/plants/${plantId}/edit`);
}

export async function deleteSize(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("size_id") ?? "");
  const plantId = String(formData.get("plant_id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("plant_sizes").delete().eq("id", id);
  revalidatePath(`/plants/${plantId}/edit`);
}

// ---- images (Supabase Storage) --------------------------------------------
const BUCKET = "plant-images";

export async function uploadImage(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const plantId = String(formData.get("plant_id") ?? "");
  const file = formData.get("file");
  if (!plantId || !(file instanceof File) || file.size === 0) return;
  if (file.size > 5 * 1024 * 1024) return;

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${session.organizationId}/${plantId}/${crypto.randomUUID()}.${ext}`;

  const supabase = await createClient();
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined });
  if (upErr) return;

  const { count } = await supabase
    .from("plant_images")
    .select("id", { count: "exact", head: true })
    .eq("plant_id", plantId);

  const { error } = await supabase.from("plant_images").insert({
    organization_id: session.organizationId,
    plant_id: plantId,
    storage_path: path,
    is_primary: (count ?? 0) === 0,
    created_by: session.userId,
  });
  if (error) await supabase.storage.from(BUCKET).remove([path]);
  revalidatePath(`/plants/${plantId}/edit`);
}

export async function deleteImage(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("image_id") ?? "");
  const plantId = String(formData.get("plant_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { data: img } = await supabase
    .from("plant_images")
    .select("storage_path, is_primary")
    .eq("id", id)
    .single();
  if (!img) return;

  await supabase.from("plant_images").delete().eq("id", id);
  await supabase.storage.from(BUCKET).remove([img.storage_path]);

  if (img.is_primary) {
    const { data: next } = await supabase
      .from("plant_images")
      .select("id")
      .eq("plant_id", plantId)
      .limit(1)
      .maybeSingle();
    if (next) {
      await supabase
        .from("plant_images")
        .update({ is_primary: true })
        .eq("id", next.id);
    }
  }
  revalidatePath(`/plants/${plantId}/edit`);
}

export async function setPrimaryImage(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("image_id") ?? "");
  const plantId = String(formData.get("plant_id") ?? "");
  if (!id || !plantId) return;
  const supabase = await createClient();
  await supabase
    .from("plant_images")
    .update({ is_primary: false })
    .eq("plant_id", plantId);
  await supabase.from("plant_images").update({ is_primary: true }).eq("id", id);
  revalidatePath(`/plants/${plantId}/edit`);
}

// ---- pricing ---------------------------------------------------------------
export async function upsertPlantPrice(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const parsed = priceSchema.safeParse({
    plant_id: formData.get("plant_id"),
    size_id: formData.get("size_id"),
    min_price: formData.get("min_price") ?? "",
    recommended_price: formData.get("recommended_price") ?? "",
    retail_price: formData.get("retail_price") ?? "",
  });
  if (!parsed.success) return;
  const v = parsed.data;
  const toNum = (x: number | "") => (x === "" ? null : x);

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("plant_prices")
    .upsert(
      {
        organization_id: session.organizationId,
        plant_id: v.plant_id,
        size_id: v.size_id,
        min_price: toNum(v.min_price),
        recommended_price: toNum(v.recommended_price),
        retail_price: toNum(v.retail_price),
        updated_by: session.userId,
      },
      { onConflict: "plant_id,size_id" },
    )
    .select("id")
    .single();
  if (error) return;

  // Price changes are audit-logged (CLAUDE.md §3).
  await supabase.from("audit_logs").insert({
    organization_id: session.organizationId,
    actor_id: session.userId,
    action: "plant_price_change",
    entity: "plant_prices",
    entity_id: row?.id ?? null,
    new_value: {
      plant_id: v.plant_id,
      size_id: v.size_id,
      min_price: toNum(v.min_price),
      recommended_price: toNum(v.recommended_price),
      retail_price: toNum(v.retail_price),
    },
  });

  revalidatePath(`/plants/${v.plant_id}/edit`);
}
