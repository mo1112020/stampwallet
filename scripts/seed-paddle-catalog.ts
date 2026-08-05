// One-time setup: creates the Starter/Pro products and their monthly/
// quarterly/yearly prices in Paddle sandbox. Re-running this creates
// duplicates (Paddle has no "upsert by name" — delete the old ones in the
// dashboard first if you need to redo this). Run with:
//   npx tsx scripts/seed-paddle-catalog.ts
import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import fs from "fs";

const envFile = fs.readFileSync(".env.local", "utf8");
for (const line of envFile.split("\n")) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: Environment.sandbox,
});

async function createPlan(name: string, description: string, monthlyCents: string, quarterlyCents: string, yearlyCents: string) {
  const product = await paddle.products.create({
    name,
    taxCategory: "saas",
    description,
  });

  const monthly = await paddle.prices.create({
    productId: product.id,
    description: `${name} monthly USD`,
    unitPrice: { amount: monthlyCents, currencyCode: "USD" },
    billingCycle: { interval: "month", frequency: 1 },
  });

  const quarterly = await paddle.prices.create({
    productId: product.id,
    description: `${name} quarterly USD`,
    unitPrice: { amount: quarterlyCents, currencyCode: "USD" },
    billingCycle: { interval: "month", frequency: 3 },
  });

  const yearly = await paddle.prices.create({
    productId: product.id,
    description: `${name} yearly USD`,
    unitPrice: { amount: yearlyCents, currencyCode: "USD" },
    billingCycle: { interval: "year", frequency: 1 },
  });

  return {
    productId: product.id,
    monthlyPriceId: monthly.id,
    quarterlyPriceId: quarterly.id,
    yearlyPriceId: yearly.id,
  };
}

async function seed() {
  const starter = await createPlan(
    "Starter",
    "For growing businesses ready to customize their branding.",
    "2900",
    "8300",
    "29000"
  );

  const pro = await createPlan(
    "Pro",
    "For established loyalty programs across multiple locations.",
    "7900",
    "22500",
    "79000"
  );

  console.log(JSON.stringify({ starter, pro }, null, 2));
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
