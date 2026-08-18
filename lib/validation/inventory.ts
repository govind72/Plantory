import { z } from "zod";

export const lossReasons = [
  "died",
  "damage",
  "pest_disease",
  "transport_damage",
  "unknown",
  "other",
] as const;

export const transferItemSchema = z.object({
  plant_id: z.string().uuid(),
  size_id: z.string().uuid(),
  quantity: z.coerce.number().int().positive().max(1_000_000),
});

export const transferSchema = z.object({
  from_outlet: z.string().uuid(),
  to_outlet: z.string().uuid(),
  note: z.string().trim().max(300).optional().or(z.literal("")),
  items: z.array(transferItemSchema).min(1),
});

export const lossSchema = z.object({
  outlet_id: z.string().uuid(),
  plant_id: z.string().uuid(),
  size_id: z.string().uuid(),
  quantity: z.coerce.number().int().positive().max(1_000_000),
  reason: z.enum(lossReasons),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});
