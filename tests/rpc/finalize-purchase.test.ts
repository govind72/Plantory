/**
 * Integration test for finalize_purchase() against LOCAL Supabase.
 *   npm run db:start && npm run seed:owner && npm run test:rls
 *
 * Verifies the atomic finalize: landed-cost allocation, batch creation, stock
 * movements, purchase totals/status — and that the SQL matches the tested TS
 * allocateLandedCost(). Also asserts a finalized purchase can't be re-finalized.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { allocateLandedCost } from "@/lib/domain/landed-cost";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* defaults below */
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const ORG = "11111111-1111-4111-8111-111111111111";
const MAIN = "22222222-2222-4222-8222-222222222222";
const rid = Math.random().toString(36).slice(2, 8);

const admin = createClient(URL, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let owner: SupabaseClient;
let purchaseId: string;
let plantId: string;
let size1: string;
let size2: string;
let item1: string;
let item2: string;

async function insert<T extends Record<string, unknown>>(
  table: string,
  row: T,
): Promise<string> {
  const { data, error } = await admin.from(table).insert(row).select("id").single();
  if (error) throw error;
  return data.id;
}

beforeAll(async () => {
  plantId = await insert("plants", {
    organization_id: ORG,
    common_name_en: `Finalize Plant ${rid}`,
  });
  size1 = await insert("plant_sizes", {
    organization_id: ORG,
    plant_id: plantId,
    label: "6 ft",
    height_ft: 6,
  });
  size2 = await insert("plant_sizes", {
    organization_id: ORG,
    plant_id: plantId,
    label: "8 ft",
    height_ft: 8,
  });

  purchaseId = await insert("purchases", {
    organization_id: ORG,
    outlet_id: MAIN,
    purchase_date: "2026-08-18",
    status: "draft",
  });

  item1 = await insert("purchase_items", {
    organization_id: ORG,
    outlet_id: MAIN,
    purchase_id: purchaseId,
    plant_id: plantId,
    size_id: size1,
    quantity: 100,
    unit_cost: 350,
    line_amount: 35000,
  });
  item2 = await insert("purchase_items", {
    organization_id: ORG,
    outlet_id: MAIN,
    purchase_id: purchaseId,
    plant_id: plantId,
    size_id: size2,
    quantity: 50,
    unit_cost: 450,
    line_amount: 22500,
  });
  await insert("purchase_expenses", {
    organization_id: ORG,
    outlet_id: MAIN,
    purchase_id: purchaseId,
    label: "Truck fare",
    amount: 5750,
  });

  owner = createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await owner.auth.signInWithPassword({
    email: "admin@gmail.com",
    password: "Admin1234",
  });
  if (error) throw error;
});

afterAll(async () => {
  await admin.from("stock_movements").delete().eq("reference_id", purchaseId);
  await admin.from("inventory_batches").delete().in("purchase_item_id", [item1, item2]);
  await admin.from("purchases").delete().eq("id", purchaseId); // cascades items + expenses
  await admin.from("plants").delete().eq("id", plantId); // cascades sizes
});

describe("finalize_purchase", () => {
  it("finalizes: landed cost, batches, movements, totals", async () => {
    const { error } = await owner.rpc("finalize_purchase", {
      p_purchase_id: purchaseId,
    });
    expect(error).toBeNull();

    // reference values from the tested TS function
    const ref = allocateLandedCost(
      [
        { id: item1, quantity: 100, unitCost: 350 },
        { id: item2, quantity: 50, unitCost: 450 },
      ],
      5750,
    );
    const refUnit = (id: string) =>
      ref.lines.find((l) => l.id === id)!.landedUnitCost;
    expect(refUnit(item1)).toBe(385);
    expect(refUnit(item2)).toBe(495);

    // purchase header
    const { data: purchase } = await admin
      .from("purchases")
      .select("status, items_subtotal, expenses_total, landed_total")
      .eq("id", purchaseId)
      .single();
    expect(purchase?.status).toBe("finalized");
    expect(Number(purchase?.items_subtotal)).toBe(57500);
    expect(Number(purchase?.expenses_total)).toBe(5750);
    expect(Number(purchase?.landed_total)).toBe(63250);

    // per-item landed unit cost matches TS
    const { data: items } = await admin
      .from("purchase_items")
      .select("id, landed_unit_cost")
      .eq("purchase_id", purchaseId);
    for (const it of items ?? []) {
      expect(Number(it.landed_unit_cost)).toBe(refUnit(it.id));
    }

    // batches created with correct qty + cost
    const { data: batches } = await admin
      .from("inventory_batches")
      .select("size_id, qty_received, qty_remaining, landed_unit_cost")
      .in("purchase_item_id", [item1, item2]);
    expect(batches?.length).toBe(2);
    const b1 = batches!.find((b) => b.size_id === size1)!;
    expect(b1.qty_received).toBe(100);
    expect(b1.qty_remaining).toBe(100);
    expect(Number(b1.landed_unit_cost)).toBe(385);

    // one 'purchase' movement per batch
    const { data: movements } = await admin
      .from("stock_movements")
      .select("movement_type, quantity, unit_cost")
      .eq("reference_id", purchaseId);
    expect(movements?.length).toBe(2);
    expect(movements!.every((m) => m.movement_type === "purchase")).toBe(true);
    const total = movements!.reduce((s, m) => s + m.quantity, 0);
    expect(total).toBe(150);
  });

  it("cannot be finalized twice", async () => {
    const { error } = await owner.rpc("finalize_purchase", {
      p_purchase_id: purchaseId,
    });
    expect(error).not.toBeNull();
  });
});
