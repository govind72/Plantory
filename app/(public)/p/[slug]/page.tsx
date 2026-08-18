/* eslint-disable @next/next/no-img-element */
import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { publicImageUrl } from "@/lib/storage";
import { buildWaLink } from "@/lib/domain/whatsapp";
import { Sun, Droplets, Home, Leaf, MessageCircle } from "lucide-react";

type PublicPlant = {
  nursery_name: string;
  nursery_whatsapp: string | null;
  common_name_en: string;
  common_name_hi: string | null;
  scientific_name: string | null;
  local_name: string | null;
  variety: string | null;
  description_en: string | null;
  description_hi: string | null;
  care_en: string | null;
  care_hi: string | null;
  sunlight: string | null;
  water: string | null;
  placement: string | null;
  unit: string;
  sizes: { height_ft: number | null; bag_size: string | null; label: string }[];
  images: { storage_path: string; alt: string | null }[];
};

export default async function PublicPlantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_plant", { p_slug: slug });
  const t = await getTranslations("publicPlant");
  const tAttr = await getTranslations("plantAttrs");
  const locale = await getLocale();

  if (!data) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6 text-center text-muted-foreground">
        {t("notFound")}
      </main>
    );
  }

  const p = data as unknown as PublicPlant;
  const pick = (en: string | null, hi: string | null) =>
    locale === "hi" && hi ? hi : en;
  const name = pick(p.common_name_en, p.common_name_hi) ?? "";
  const description = pick(p.description_en, p.description_hi);
  const care = pick(p.care_en, p.care_hi);

  const attributes = [
    p.sunlight && {
      icon: Sun,
      label: t("sunlight"),
      value: tAttr(`sunlight.${p.sunlight}`),
    },
    p.water && {
      icon: Droplets,
      label: t("water"),
      value: tAttr(`water.${p.water}`),
    },
    p.placement && {
      icon: Home,
      label: t("placement"),
      value: tAttr(`placement.${p.placement}`),
    },
  ].filter(Boolean) as { icon: typeof Sun; label: string; value: string }[];

  const waLink = p.nursery_whatsapp
    ? buildWaLink(
        p.nursery_whatsapp,
        t("enquiryMessage", { plant: name, nursery: p.nursery_name }),
      )
    : null;

  return (
    <main className="mx-auto max-w-xl px-4 py-8 pb-28">
      <header className="mb-5 text-center">
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold tracking-wide text-primary">
          <Leaf className="size-4" />
          {p.nursery_name}
        </p>
      </header>

      {p.images.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl border">
          <img
            src={publicImageUrl(p.images[0].storage_path)}
            alt={p.images[0].alt ?? name}
            className="aspect-[4/3] w-full object-cover"
          />
          {p.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-2">
              {p.images.slice(1).map((img, i) => (
                <img
                  key={i}
                  src={publicImageUrl(img.storage_path)}
                  alt={img.alt ?? ""}
                  className="size-16 shrink-0 rounded-md object-cover"
                />
              ))}
            </div>
          )}
        </div>
      )}

      <h1 className="text-3xl font-semibold tracking-tight text-balance">
        {name}
      </h1>
      {p.scientific_name && (
        <p className="mt-1 text-sm italic text-muted-foreground">
          {p.scientific_name}
        </p>
      )}
      {(p.local_name || p.variety) && (
        <p className="mt-1 text-sm text-muted-foreground">
          {[p.local_name, p.variety].filter(Boolean).join(" · ")}
        </p>
      )}

      {attributes.length > 0 && (
        <div className="mt-5 grid grid-cols-3 gap-3">
          {attributes.map((a) => (
            <div
              key={a.label}
              className="rounded-xl border bg-card p-3 text-center"
            >
              <a.icon className="mx-auto mb-1 size-5 text-primary" />
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {a.label}
              </p>
              <p className="text-sm font-medium">{a.value}</p>
            </div>
          ))}
        </div>
      )}

      {description && (
        <p className="mt-6 leading-relaxed whitespace-pre-line">{description}</p>
      )}

      {care && (
        <section className="mt-6">
          <h2 className="mb-1.5 text-lg font-semibold">{t("care")}</h2>
          <p className="leading-relaxed whitespace-pre-line text-muted-foreground">
            {care}
          </p>
        </section>
      )}

      {p.sizes.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">{t("sizes")}</h2>
          <div className="flex flex-wrap gap-2">
            {p.sizes.map((s, i) => (
              <span
                key={i}
                className="rounded-full border bg-secondary px-3 py-1 text-sm text-secondary-foreground"
              >
                {s.label}
              </span>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-10 text-center text-xs text-muted-foreground">
        {t("poweredBy")}
      </footer>

      {waLink && (
        <div className="fixed inset-x-0 bottom-0 border-t bg-background/95 p-3 backdrop-blur">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-auto flex max-w-xl items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground"
          >
            <MessageCircle className="size-5" />
            {t("enquire")}
          </a>
        </div>
      )}
    </main>
  );
}
