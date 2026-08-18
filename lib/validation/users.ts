import { z } from "zod";
import { userRoles } from "./settings";

export const appLanguages = ["en", "hi"] as const;

export const provisionUserSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
  role: z.enum(userRoles),
  mobile: z.string().trim().max(20).optional().or(z.literal("")),
  preferred_language: z.enum(appLanguages),
  outlet_ids: z.array(z.string().uuid()).default([]),
});

export type ProvisionUserInput = z.infer<typeof provisionUserSchema>;
