/**
 * Seed a demo merchant + stamp program.
 *
 * Prerequisites:
 * 1. Apply supabase/migrations/001_initial_schema.sql in your Supabase SQL editor
 * 2. Copy .env.example → .env.local and fill NEXT_PUBLIC_SUPABASE_URL,
 *    NEXT_PUBLIC_SUPABASE_ANON_KEY (or PUBLISHABLE_KEY),
 *    SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)
 *
 * Run: npm run seed
 *
 * Creates/updates:
 *   email: demo@stampwallet.local
 *   password: demo-password-123
 *   business: Demo Coffee
 *   program: Coffee Club (stamp 10)
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const email = "demo@stampwallet.local";
  const password = "demo-password-123";

  const list = await admin.auth.admin.listUsers();
  let user = list.data.users.find((u) => u.email === email);

  if (!user) {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { business_name: "Demo Coffee" },
    });
    if (created.error || !created.data.user) {
      throw created.error ?? new Error("Failed to create user");
    }
    user = created.data.user;
    console.log("Created demo user", user.id);
  } else {
    console.log("Demo user already exists", user.id);
  }

  await admin.from("merchants").upsert({
    id: user.id,
    business_name: "Demo Coffee",
    industry: "coffee_shop",
    brand_color_primary: "#3E0856",
    brand_color_secondary: "#FAAE62",
    plan: "free",
    onboarding_completed: true,
    locale_default: "en",
  });

  const { data: existing } = await admin
    .from("loyalty_programs")
    .select("id")
    .eq("merchant_id", user.id)
    .eq("name", "Coffee Club")
    .maybeSingle();

  if (!existing) {
    const { data: program, error } = await admin
      .from("loyalty_programs")
      .insert({
        merchant_id: user.id,
        name: "Coffee Club",
        type: "stamp",
        config: {
          stamps_required: 10,
          reward_description: "Free coffee",
          icon: "☕",
        },
      })
      .select("*")
      .single();
    if (error) throw error;
    console.log("Created program", program.id);
  } else {
    console.log("Program already exists", existing.id);
  }

  console.log("\nDemo login:");
  console.log("  email:", email);
  console.log("  password:", password);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
