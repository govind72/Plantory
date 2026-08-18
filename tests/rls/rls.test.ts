/**
 * RLS behaviour tests against the LOCAL Supabase stack.
 *
 * Prereqs:  npm run db:start  &&  npm run seed:owner
 * Run with: npm run test:rls
 *
 * These verify the security boundary end-to-end by signing in as real users of
 * each role and asserting what they can / cannot read and write. They create
 * their own fixtures under the seeded Shangrila org (+ a throwaway second org)
 * and clean everything up afterwards.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

// Load local env (Node 22).
try {
  process.loadEnvFile(".env.local");
} catch {
  // fall through to defaults below
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const ORG = "11111111-1111-4111-8111-111111111111"; // Shangrila (seeded)
const MAIN = "22222222-2222-4222-8222-222222222222"; // Main Nursery (seeded)
const PASSWORD = "TestPass123";
const rid = Math.random().toString(36).slice(2, 8);

const admin = createClient(URL, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---- fixture handles ----
let outletBId: string;
let otherOrgId: string;
let plantId: string;
let sizeId: string;
let priceId: string;
let batchMainId: string;
let batchBId: string;
const userIds: string[] = [];
const customerIds: string[] = [];

let mgrA: SupabaseClient;
let staffA: SupabaseClient;
let staffB: SupabaseClient;
let otherStaff: SupabaseClient;
let owner: SupabaseClient;

async function createUser(
  role: "owner" | "admin" | "outlet_manager" | "staff",
  orgId: string,
  outletId?: string,
) {
  const email = `rls_${role}_${rid}_${Math.random().toString(36).slice(2, 6)}@test.local`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("createUser failed");
  const uid = data.user.id;
  userIds.push(uid);
  const { error: pe } = await admin.from("profiles").insert({
    id: uid,
    organization_id: orgId,
    full_name: `RLS ${role}`,
    role,
    active: true,
    preferred_language: "en",
  });
  if (pe) throw pe;
  if (outletId) {
    const { error: ue } = await admin
      .from("user_outlets")
      .insert({ organization_id: orgId, user_id: uid, outlet_id: outletId });
    if (ue) throw ue;
  }
  return email;
}

async function signIn(email: string): Promise<SupabaseClient> {
  const client = createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  if (error) throw error;
  return client;
}

beforeAll(async () => {
  // second outlet in the seeded org
  const { data: ob, error: obErr } = await admin
    .from("outlets")
    .insert({ organization_id: ORG, name: `Outlet B ${rid}` })
    .select("id")
    .single();
  if (obErr) throw obErr;
  outletBId = ob.id;

  // a throwaway second org (for cross-org isolation)
  const { data: oo, error: ooErr } = await admin
    .from("organizations")
    .insert({ name: `Other Org ${rid}` })
    .select("id")
    .single();
  if (ooErr) throw ooErr;
  otherOrgId = oo.id;

  // catalogue + pricing + stock (admin bypasses RLS)
  const { data: plant, error: pErr } = await admin
    .from("plants")
    .insert({ organization_id: ORG, common_name_en: `RLS Plant ${rid}` })
    .select("id")
    .single();
  if (pErr) throw pErr;
  plantId = plant.id;

  const { data: size, error: sErr } = await admin
    .from("plant_sizes")
    .insert({
      organization_id: ORG,
      plant_id: plantId,
      height_ft: 6,
      bag_size: "12 inch",
      label: "6 ft • 12in bag",
    })
    .select("id")
    .single();
  if (sErr) throw sErr;
  sizeId = size.id;

  const { data: price, error: prErr } = await admin
    .from("plant_prices")
    .insert({
      organization_id: ORG,
      plant_id: plantId,
      size_id: sizeId,
      min_price: 100,
      recommended_price: 150,
    })
    .select("id")
    .single();
  if (prErr) throw prErr;
  priceId = price.id;

  const { data: bm, error: bmErr } = await admin
    .from("inventory_batches")
    .insert({
      organization_id: ORG,
      outlet_id: MAIN,
      plant_id: plantId,
      size_id: sizeId,
      landed_unit_cost: 50,
      qty_received: 10,
      qty_remaining: 10,
    })
    .select("id")
    .single();
  if (bmErr) throw bmErr;
  batchMainId = bm.id;

  const { data: bb, error: bbErr } = await admin
    .from("inventory_batches")
    .insert({
      organization_id: ORG,
      outlet_id: outletBId,
      plant_id: plantId,
      size_id: sizeId,
      landed_unit_cost: 60,
      qty_received: 5,
      qty_remaining: 5,
    })
    .select("id")
    .single();
  if (bbErr) throw bbErr;
  batchBId = bb.id;

  // users
  const mgrEmail = await createUser("outlet_manager", ORG, MAIN);
  const staffAEmail = await createUser("staff", ORG, MAIN);
  const staffBEmail = await createUser("staff", ORG, outletBId);
  const otherEmail = await createUser("staff", otherOrgId);

  mgrA = await signIn(mgrEmail);
  staffA = await signIn(staffAEmail);
  staffB = await signIn(staffBEmail);
  otherStaff = await signIn(otherEmail);

  // seeded owner uses its own password
  owner = createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: ownerErr } = await owner.auth.signInWithPassword({
    email: "admin@gmail.com",
    password: "Admin1234",
  });
  if (ownerErr) throw ownerErr;
});

afterAll(async () => {
  for (const id of customerIds) await admin.from("customers").delete().eq("id", id);
  await admin.from("inventory_batches").delete().eq("id", batchMainId);
  await admin.from("inventory_batches").delete().eq("id", batchBId);
  await admin.from("plants").delete().eq("id", plantId); // cascades sizes + prices
  for (const uid of userIds) await admin.auth.admin.deleteUser(uid); // cascades profiles + user_outlets
  await admin.from("outlets").delete().eq("id", outletBId);
  await admin.from("organizations").delete().eq("id", otherOrgId);
});

describe("catalogue & pricing", () => {
  it("staff can read the catalogue", async () => {
    const { data } = await staffA.from("plants").select("id").eq("id", plantId);
    expect(data?.length).toBe(1);
  });

  it("staff can read prices (they need the floor to sell)", async () => {
    const { data } = await staffA
      .from("plant_prices")
      .select("min_price")
      .eq("id", priceId)
      .maybeSingle();
    expect(data?.min_price).toBe(100);
  });

  it("staff CANNOT change prices (write blocked → 0 rows)", async () => {
    await staffA.from("plant_prices").update({ min_price: 1 }).eq("id", priceId);
    const { data } = await admin
      .from("plant_prices")
      .select("min_price")
      .eq("id", priceId)
      .single();
    expect(data?.min_price).toBe(100); // unchanged
  });
});

describe("cost is hidden from staff", () => {
  it("staff CANNOT read inventory_batches (cost table)", async () => {
    const { data } = await staffA.from("inventory_batches").select("*");
    expect(data?.length).toBe(0);
  });

  it("staff CANNOT insert into inventory_batches", async () => {
    const { error } = await staffA.from("inventory_batches").insert({
      organization_id: ORG,
      outlet_id: MAIN,
      plant_id: plantId,
      size_id: sizeId,
      landed_unit_cost: 1,
      qty_received: 1,
      qty_remaining: 1,
    });
    expect(error).not.toBeNull();
  });

  it("get_outlet_stock returns quantity WITHOUT cost for their outlet", async () => {
    const { data } = await staffA.rpc("get_outlet_stock", { p_outlet: MAIN });
    const rows = (data ?? []) as Array<{
      plant_id: string;
      qty_available: number;
    }>;
    const row = rows.find((r) => r.plant_id === plantId);
    expect(row?.qty_available).toBe(10);
    expect(row && "landed_unit_cost" in row).toBe(false);
  });

  it("get_outlet_stock returns nothing for an outlet the staff is not in", async () => {
    const { data } = await staffA.rpc("get_outlet_stock", { p_outlet: outletBId });
    expect(data?.length).toBe(0);
  });
});

describe("outlet scoping", () => {
  it("staff at Outlet B cannot see Main Nursery stock", async () => {
    const { data } = await staffB.rpc("get_outlet_stock", { p_outlet: MAIN });
    expect(data?.length).toBe(0);
  });

  it("manager sees their outlet's batches but not another outlet's", async () => {
    const { data } = await mgrA.from("inventory_batches").select("id");
    const ids = (data ?? []).map((b) => b.id);
    expect(ids).toContain(batchMainId);
    expect(ids).not.toContain(batchBId);
  });
});

describe("cross-org isolation", () => {
  it("a user in another org cannot see this org's plants", async () => {
    const { data } = await otherStaff.from("plants").select("id").eq("id", plantId);
    expect(data?.length).toBe(0);
  });
});

describe("staff can do their job", () => {
  it("staff can create a customer", async () => {
    const { data, error } = await staffA
      .from("customers")
      .insert({ organization_id: ORG, name: `RLS Customer ${rid}` })
      .select("id")
      .single();
    expect(error).toBeNull();
    if (data?.id) customerIds.push(data.id);
    expect(data?.id).toBeTruthy();
  });
});

describe("owner full access", () => {
  it("owner sees batches across all outlets", async () => {
    const { data } = await owner.from("inventory_batches").select("id");
    const ids = (data ?? []).map((b) => b.id);
    expect(ids).toContain(batchMainId);
    expect(ids).toContain(batchBId);
  });
});
