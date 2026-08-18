/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { publicImageUrl } from "@/lib/storage";
import {
  togglePlantActive,
  deleteSize,
  uploadImage,
  deleteImage,
  setPrimaryImage,
} from "../../actions";
import { PlantForm } from "@/components/plant-form";
import { AddSizeForm } from "@/components/add-size-form";
import { PricingEditor, type SizePrice } from "@/components/pricing-editor";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  ExternalLink,
  QrCode,
  Trash2,
  Star,
  Upload,
} from "lucide-react";

export default async function EditPlantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin();
  const supabase = await createClient();
  const t = await getTranslations("plants");
  const ts = await getTranslations("plants.sizes");
  const ti = await getTranslations("plants.images");
  const tPricing = await getTranslations("pricing");
  const locale = await getLocale();

  const [
    { data: plant },
    { data: categories },
    { data: sizes },
    { data: images },
    { data: settings },
    { data: prices },
    { data: batches },
  ] = await Promise.all([
    supabase.from("plants").select("*").eq("id", id).single(),
    supabase
      .from("plant_categories")
      .select("id, name_en, name_hi")
      .eq("active", true)
      .order(locale === "hi" ? "name_hi" : "name_en"),
    supabase
      .from("plant_sizes")
      .select("id, label, height_ft, bag_size")
      .eq("plant_id", id)
      .order("sort_order")
      .order("label"),
    supabase
      .from("plant_images")
      .select("id, storage_path, is_primary")
      .eq("plant_id", id)
      .order("is_primary", { ascending: false }),
    supabase
      .from("org_settings")
      .select("min_margin_pct, target_margin_pct, price_rounding_step")
      .single(),
    supabase
      .from("plant_prices")
      .select("size_id, min_price, recommended_price, retail_price")
      .eq("plant_id", id),
    supabase
      .from("inventory_batches")
      .select("size_id, qty_received, landed_unit_cost")
      .eq("plant_id", id),
  ]);

  if (!plant) notFound();

  // Reference landed cost per size = weighted average of received batches.
  const landedBySize = new Map<string, { qty: number; total: number }>();
  for (const b of batches ?? []) {
    const cur = landedBySize.get(b.size_id) ?? { qty: 0, total: 0 };
    cur.qty += b.qty_received;
    cur.total += b.qty_received * Number(b.landed_unit_cost);
    landedBySize.set(b.size_id, cur);
  }
  const pricesBySize = new Map(
    (prices ?? []).map((p) => [p.size_id, p]),
  );
  const rules = {
    minMarginPct: Number(settings?.min_margin_pct ?? 15),
    targetMarginPct: Number(settings?.target_margin_pct ?? 25),
    roundingStep: Number(settings?.price_rounding_step ?? 10),
  };
  const sizePrices: SizePrice[] = (sizes ?? []).map((s) => {
    const l = landedBySize.get(s.id);
    const p = pricesBySize.get(s.id);
    return {
      sizeId: s.id,
      label: s.label,
      landedCost: l && l.qty > 0 ? Math.round((l.total / l.qty) * 100) / 100 : null,
      minPrice: p?.min_price != null ? Number(p.min_price) : null,
      recommendedPrice:
        p?.recommended_price != null ? Number(p.recommended_price) : null,
      retailPrice: p?.retail_price != null ? Number(p.retail_price) : null,
    };
  });

  const displayName =
    locale === "hi" && plant.common_name_hi
      ? plant.common_name_hi
      : plant.common_name_en;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/plants"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{displayName}</h1>
          <Badge variant={plant.active ? "default" : "secondary"}>
            {plant.active ? t("active") : t("inactive")}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/p/${plant.public_slug}`}
            target="_blank"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ExternalLink className="size-4" />
            {t("viewPublic")}
          </Link>
          <Link
            href={`/plants/${id}/label`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <QrCode className="size-4" />
            {t("printLabel")}
          </Link>
          <form action={togglePlantActive}>
            <input type="hidden" name="plant_id" value={id} />
            <input
              type="hidden"
              name="active"
              value={plant.active ? "false" : "true"}
            />
            <Button type="submit" variant="outline" size="sm">
              {plant.active ? t("makeInactive") : t("makeActive")}
            </Button>
          </form>
        </div>
      </div>

      <PlantForm
        mode="edit"
        categories={categories ?? []}
        initial={{
          id: plant.id,
          common_name_en: plant.common_name_en,
          common_name_hi: plant.common_name_hi,
          scientific_name: plant.scientific_name,
          local_name: plant.local_name,
          category_id: plant.category_id,
          variety: plant.variety,
          unit: plant.unit,
          description_en: plant.description_en,
          description_hi: plant.description_hi,
          care_en: plant.care_en,
          care_hi: plant.care_hi,
          sunlight: plant.sunlight,
          water: plant.water,
          placement: plant.placement,
        }}
      />

      {/* Sizes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ts("title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{ts("subtitle")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="divide-y rounded-md border">
            {(sizes ?? []).length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">{ts("empty")}</p>
            ) : (
              (sizes ?? []).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {[
                        s.height_ft != null ? `${s.height_ft} ft` : null,
                        s.bag_size,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </div>
                  <form action={deleteSize}>
                    <input type="hidden" name="size_id" value={s.id} />
                    <input type="hidden" name="plant_id" value={id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      aria-label={ts("remove")}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </form>
                </div>
              ))
            )}
          </div>
          <AddSizeForm plantId={id} />
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{tPricing("title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{tPricing("subtitle")}</p>
        </CardHeader>
        <CardContent>
          <PricingEditor plantId={id} rules={rules} sizes={sizePrices} />
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ti("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(images ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">{ti("empty")}</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {(images ?? []).map((img) => (
                <div
                  key={img.id}
                  className="group relative overflow-hidden rounded-md border"
                >
                  <img
                    src={publicImageUrl(img.storage_path)}
                    alt=""
                    className="aspect-square w-full object-cover"
                  />
                  {img.is_primary && (
                    <Badge className="absolute left-1 top-1 gap-1 px-1.5 py-0 text-[10px]">
                      <Star className="size-3" />
                      {ti("primary")}
                    </Badge>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between bg-background/85 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {!img.is_primary && (
                      <form action={setPrimaryImage}>
                        <input type="hidden" name="image_id" value={img.id} />
                        <input type="hidden" name="plant_id" value={id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label={ti("makePrimary")}
                        >
                          <Star className="size-4" />
                        </Button>
                      </form>
                    )}
                    <form action={deleteImage} className="ml-auto">
                      <input type="hidden" name="image_id" value={img.id} />
                      <input type="hidden" name="plant_id" value={id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={ti("remove")}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form
            action={uploadImage}
            className="flex flex-wrap items-center gap-3"
          >
            <input type="hidden" name="plant_id" value={id} />
            <input
              type="file"
              name="file"
              accept="image/png,image/jpeg,image/webp"
              required
              className="text-sm file:mr-3 file:rounded-md file:border file:bg-secondary file:px-3 file:py-1.5 file:text-sm"
            />
            <Button type="submit" variant="outline" size="sm">
              <Upload className="size-4" />
              {ti("add")}
            </Button>
            <span className="text-xs text-muted-foreground">{ti("hint")}</span>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
