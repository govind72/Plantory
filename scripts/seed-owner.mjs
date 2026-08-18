// Idempotently create the Owner auth user + profile for local dev.
//   npm run seed:owner
// Reads Supabase URL/keys from .env.local (via `node --env-file`).
// Credentials default to admin@gmail.com / Admin1234, overridable via
// SEED_OWNER_EMAIL / SEED_OWNER_PASSWORD.
//
// The org + outlet come from supabase/seed.sql (fixed UUIDs).

import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const EMAIL = process.env.SEED_OWNER_EMAIL ?? "admin@gmail.com";
const PASSWORD = process.env.SEED_OWNER_PASSWORD ?? "Admin1234";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const OUTLET_ID = "22222222-2222-4222-8222-222222222222";

if (!URL || !SERVICE_KEY || !ANON_KEY) {
  console.error(
    "Missing env. Ensure NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local",
  );
  process.exit(1);
}

const admin = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email) {
  // listUsers is paginated; scan pages until found.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (data.users.length < 200) break;
  }
  return null;
}

async function main() {
  // 1) Ensure the auth user exists.
  let userId;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Nursery Owner" },
  });

  if (createErr) {
    const existing = await findUserByEmail(EMAIL);
    if (!existing) throw createErr;
    userId = existing.id;
    // Reset password so the documented dev credentials always work.
    await admin.auth.admin.updateUserById(userId, { password: PASSWORD });
    console.log(`• Auth user already existed → ${EMAIL}`);
  } else {
    userId = created.user.id;
    console.log(`• Created auth user → ${EMAIL}`);
  }

  // 2) Upsert the Owner profile (service role bypasses RLS).
  const { error: profileErr } = await admin.from("profiles").upsert(
    {
      id: userId,
      organization_id: ORG_ID,
      full_name: "Nursery Owner",
      role: "owner",
      active: true,
      preferred_language: "en",
    },
    { onConflict: "id" },
  );
  if (profileErr) throw profileErr;
  console.log("• Upserted Owner profile");

  // 3) Assign to Main Nursery (harmless for Owner; keeps a default outlet).
  const { error: uoErr } = await admin.from("user_outlets").upsert(
    { organization_id: ORG_ID, user_id: userId, outlet_id: OUTLET_ID },
    { onConflict: "user_id,outlet_id", ignoreDuplicates: true },
  );
  if (uoErr) throw uoErr;
  console.log("• Assigned to Main Nursery");

  // 4) Verify the credentials actually work (sign in with the anon client).
  const anon = createClient(URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInErr } = await anon.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (signInErr) throw new Error(`Sign-in verification failed: ${signInErr.message}`);

  console.log(`\n✅ Owner ready. Log in with:  ${EMAIL} / ${PASSWORD}`);
}

main().catch((err) => {
  console.error("\n❌ seed:owner failed:", err.message ?? err);
  process.exit(1);
});
