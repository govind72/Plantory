import { z } from "zod";

export const costAllocationMethods = [
  "purchase_value",
  "quantity",
  "weight",
  "volume",
  "manual",
] as const;

export const userRoles = ["owner", "admin", "outlet_manager", "staff"] as const;

export const orgSettingsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  gst_enabled: z.boolean(),
  gstin: z.string().trim().max(20).optional().default(""),
  whatsapp_number: z
    .string()
    .trim()
    .regex(/^\d{6,15}$/, "digits only")
    .optional()
    .or(z.literal("")),
  cost_allocation_method: z.enum(costAllocationMethods),
  min_margin_pct: z.coerce.number().min(0).max(100),
  target_margin_pct: z.coerce.number().min(0).max(100),
  price_rounding_step: z.coerce.number().min(0).max(1000),
  below_min_override_role: z.enum(userRoles),
});

export type OrgSettingsInput = z.infer<typeof orgSettingsSchema>;
