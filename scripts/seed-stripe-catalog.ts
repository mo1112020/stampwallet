// One-time setup: creates the Starter/Pro products and their monthly/
// quarterly/yearly prices in Stripe test mode. Re-running this creates
// duplicates (Stripe has no "upsert by name" — archive the old ones in the
// dashboard first if you need to redo this). Run with:
//   npx tsx scripts/seed-stripe-catalog.ts
import Stripe from "stripe";
import fs from "fs";

const envFile = fs.readFileSync(".env.local", "utf8");
for (const line of envFile.split("\n")) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function createPlan(name: string, description: string, monthlyCents: number, quarterlyCents: number, yearlyCents: number) {
  const product = await stripe.products.create({ name, description });

  const monthly = await stripe.prices.create({
    product: product.id,
    nickname: `${name} monthly USD`,
    unit_amount: monthlyCents,
    currency: "usd",
    recurring: { interval: "month" },
  });

  // Stripe has no native "every 3 months" interval shorthand — interval:
  // month with interval_count: 3 is the documented way to express quarterly.
  const quarterly = await stripe.prices.create({
    product: product.id,
    nickname: `${name} quarterly USD`,
    unit_amount: quarterlyCents,
    currency: "usd",
    recurring: { interval: "month", interval_count: 3 },
  });

  const yearly = await stripe.prices.create({
    product: product.id,
    nickname: `${name} yearly USD`,
    unit_amount: yearlyCents,
    currency: "usd",
    recurring: { interval: "year" },
  });

  return {
    productId: product.id,
    monthlyPriceId: monthly.id,
    quarterlyPriceId: quarterly.id,
    yearlyPriceId: yearly.id,
  };
}

async function seed() {
  const starter = await createPlan("Starter", "For growing businesses ready to customize their branding.", 2900, 8300, 29000);

  const pro = await createPlan("Pro", "For established loyalty programs across multiple locations.", 7900, 22500, 79000);

  console.log(JSON.stringify({ starter, pro }, null, 2));
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
