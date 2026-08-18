/**
 * Integration tests for record_loss() and transfer_stock() against LOCAL
 * Supabase. Verifies FIFO consumption, movements, cost preservation across a
 * transfer, and that an over-draw raises AND rolls back (no negative stock).
 *   npm run db:start && npm run seed:owner && npm run test:rls
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

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
let outletB: string;
let plantA: string;
let plantB: string;
let sizeA: string;
let sizeB: string;
let transferId: string | null = null;

async function ins<T extends Record<string, unknown>>(t: string, r: T) {
  const { data, error } = await admin.from(t).insert(r).select("id").single();
  if (error) throw error;
  return data.id as string;
}
async function batch(
  outlet: string,
  plant: string,
  size: string,
  qty: number,
  cost: number,
  receivedAt: string,
) {
  return ins("inventory_batches", {
    organization_id: ORG,
    outlet_id: outlet,
    plant_id: plant,
    size_id: size,
    landed_unit_cost: cost,
    qty_received: qty,
    qty_remaining: qty,
    received_at: receivedAt,
  });
}
const remaining = async (batchId: string) => {
  const { data } = await admin
    .from("inventory_batches")
    .select("qty_remaining")
    .eq("id", batchId)
    .single();
  return data?.qty_remaining ?? null;
};

let aB1: string, aB2: string, bB1: string, bB2: string;

beforeAll(async () => {
  outletB = await ins("outlets", { organization_id: ORG, name: `Outlet B ${rid}` });
  plantA = await ins("plants", { organization_id: ORG, common_name_en: `Loss Plant ${rid}` });
  plantB = await ins("plants", { organization_id: ORG, common_name_en: `Xfer Plant ${rid}` });
  sizeA = await ins("plant_sizes", { organization_id: ORG, plant_id: plantA, label: "6 ft" });
  sizeB = await ins("plant_sizes", { organization_id: ORG, plant_id: plantB, label: "6 ft" });

  // plantA @ Main: 100@300 (older) + 100@400
  aB1 = await batch(MAIN, plantA, sizeA, 100, 300, "2026-08-01T00:00:00Z");
  aB2 = await batch(MAIN, plantA, sizeA, 100, 400, "2026-08-02T00:00:00Z");
  // plantB @ Main: 100@300 (older) + 50@400
  bB1 = await batch(MAIN, plantB, sizeB, 100, 300, "2026-08-01T00:00:00Z");
  bB2 = await batch(MAIN, plantB, sizeB, 50, 400, "2026-08-02T00:00:00Z");

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
  await admin.from("stock_movements").delete().in("plant_id", [plantA, plantB]);
  await admin.from("plant_losses").delete().in("plant_id", [plantA, plantB]);
  if (transferId) await admin.from("stock_transfers").delete().eq("id", transferId);
  await admin.from("inventory_batches").delete().in("plant_id", [plantA, plantB]);
  await admin.from("plants").delete().in("id", [plantA, plantB]);
  await admin.from("outlets").delete().eq("id", outletB);
});

describe("record_loss", () => {
  it("FIFO-consumes the oldest batch and writes a mortality movement", async () => {
    const { error } = await owner.rpc("record_loss", {
      p_outlet: MAIN,
      p_plant: plantA,
      p_size: sizeA,
      p_qty: 60,
      p_reason: "died",
      p_note: "test loss",
    });
    expect(error).toBeNull();

    expect(await remaining(aB1)).toBe(40); // 100 - 60
    expect(await remaining(aB2)).toBe(100); // untouched

    const { data: moves } = await admin
      .from("stock_movements")
      .select("movement_type, quantity, unit_cost")
      .eq("plant_id", plantA)
      .eq("reference_type", "loss");
    expect(moves?.length).toBe(1);
    expect(moves![0].movement_type).toBe("mortality");
    expect(moves![0].quantity).toBe(60);
    expect(Number(moves![0].unit_cost)).toBe(300);
  });

  it("rejects a loss larger than stock", async () => {
    const { error } = await owner.rpc("record_loss", {
      p_outlet: MAIN,
      p_plant: plantA,
      p_size: sizeA,
      p_qty: 999,
      p_reason: "died",
    });
    expect(error).not.toBeNull();
  });
});

describe("transfer_stock", () => {
  it("moves stock FIFO to another outlet, preserving batch cost", async () => {
    const { data, error } = await owner.rpc("transfer_stock", {
      p_from_outlet: MAIN,
      p_to_outlet: outletB,
      p_items: [{ plant_id: plantB, size_id: sizeB, quantity: 120 }],
      p_note: "test transfer",
    });
    expect(error).toBeNull();
    transferId = data as string;

    // source drawn down FIFO: 100 from bB1, 20 from bB2
    expect(await remaining(bB1)).toBe(0);
    expect(await remaining(bB2)).toBe(30);

    // destination batches preserve cost (100@300 + 20@400)
    const { data: destBatches } = await admin
      .from("inventory_batches")
      .select("qty_remaining, landed_unit_cost")
      .eq("outlet_id", outletB)
      .eq("plant_id", plantB);
    const totalQty = destBatches!.reduce((s, b) => s + b.qty_remaining, 0);
    expect(totalQty).toBe(120);
    const at300 = destBatches!.find((b) => Number(b.landed_unit_cost) === 300);
    const at400 = destBatches!.find((b) => Number(b.landed_unit_cost) === 400);
    expect(at300?.qty_remaining).toBe(100);
    expect(at400?.qty_remaining).toBe(20);

    // two out + two in movements
    const { data: outs } = await admin
      .from("stock_movements")
      .select("quantity")
      .eq("plant_id", plantB)
      .eq("movement_type", "transfer_out");
    const { data: ins2 } = await admin
      .from("stock_movements")
      .select("quantity")
      .eq("plant_id", plantB)
      .eq("movement_type", "transfer_in");
    expect(outs?.length).toBe(2);
    expect(ins2?.length).toBe(2);
  });

  it("rejects an over-draw and rolls back (no negative stock)", async () => {
    const before = await remaining(bB2); // 30
    const { error } = await owner.rpc("transfer_stock", {
      p_from_outlet: MAIN,
      p_to_outlet: outletB,
      p_items: [{ plant_id: plantB, size_id: sizeB, quantity: 999 }],
    });
    expect(error).not.toBeNull();
    expect(await remaining(bB2)).toBe(before); // unchanged — rolled back
  });
});
