import { z } from "zod";

const optionalText = (max = 300) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const outletSchema = z.object({
  name: z.string().trim().min(1).max(120),
  address: optionalText(300),
  phone: optionalText(30),
});
export type OutletInput = z.infer<typeof outletSchema>;
