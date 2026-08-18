import { z } from "zod";

// Empty string (unset) OR a non-negative number. Order matters: check "" first
// so an empty field stays "" rather than coercing to 0.
const optPrice = () =>
  z.literal("").or(z.coerce.number().min(0).max(10_000_000));

export const priceSchema = z.object({
  plant_id: z.string().uuid(),
  size_id: z.string().uuid(),
  min_price: optPrice(),
  recommended_price: optPrice(),
  retail_price: optPrice(),
});
export type PriceInput = z.infer<typeof priceSchema>;
