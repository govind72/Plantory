import { z } from "zod";

const optionalText = (max = 500) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const supplierSchema = z.object({
  name: z.string().trim().min(1).max(150),
  contact_person: optionalText(120),
  phone: optionalText(30),
  gstin: optionalText(20),
  address: optionalText(300),
  notes: optionalText(500),
});
export type SupplierInput = z.infer<typeof supplierSchema>;

export const purchaseHeaderSchema = z.object({
  outlet_id: z.string().uuid(),
  supplier_id: z.string().uuid().optional().or(z.literal("")),
  supplier_invoice_no: optionalText(60),
  purchase_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  truck_number: optionalText(40),
  source_location: optionalText(120),
  notes: optionalText(500),
});
export type PurchaseHeaderInput = z.infer<typeof purchaseHeaderSchema>;

export const purchaseItemSchema = z.object({
  plant_id: z.string().uuid(),
  size_id: z.string().uuid(),
  quantity: z.coerce.number().int().positive().max(1_000_000),
  unit_cost: z.coerce.number().min(0).max(10_000_000),
});
export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>;

export const purchaseExpenseSchema = z.object({
  label: z.string().trim().min(1).max(80),
  amount: z.coerce.number().positive().max(10_000_000),
});
export type PurchaseExpenseInput = z.infer<typeof purchaseExpenseSchema>;
