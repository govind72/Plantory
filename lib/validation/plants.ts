import { z } from "zod";

/** Sentinel for the "—" (none) option in Selects, since empty-string item
 * values aren't allowed. The server action maps this back to "" → null. */
export const NONE_VALUE = "__none__";

export const sunlightOptions = [
  "full_sun",
  "partial_shade",
  "full_shade",
] as const;
export const waterOptions = ["low", "medium", "high"] as const;
export const placementOptions = ["indoor", "outdoor", "both"] as const;

const optionalText = (max = 2000) =>
  z.string().trim().max(max).optional().or(z.literal(""));

/** Enum value or empty string (the form's "—" option); the action maps "" → null. */
const enumOrEmpty = <T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values).or(z.literal(""));

export const categorySchema = z.object({
  name_en: z.string().trim().min(1).max(120),
  name_hi: optionalText(120),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const plantSchema = z.object({
  common_name_en: z.string().trim().min(1).max(150),
  common_name_hi: optionalText(150),
  scientific_name: optionalText(150),
  local_name: optionalText(150),
  category_id: z.string().uuid().optional().or(z.literal("")),
  variety: optionalText(150),
  description_en: optionalText(),
  description_hi: optionalText(),
  care_en: optionalText(),
  care_hi: optionalText(),
  sunlight: enumOrEmpty(sunlightOptions),
  water: enumOrEmpty(waterOptions),
  placement: enumOrEmpty(placementOptions),
  unit: z.string().trim().min(1).max(30).default("piece"),
});
export type PlantInput = z.infer<typeof plantSchema>;

export const sizeSchema = z.object({
  height_ft: z.coerce
    .number()
    .positive()
    .max(1000)
    .optional()
    .or(z.literal("")),
  bag_size: optionalText(60),
  label: z.string().trim().min(1).max(80),
});
export type SizeInput = z.infer<typeof sizeSchema>;
