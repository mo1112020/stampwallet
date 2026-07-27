import { jsonOk, requireCapability } from "@/lib/api";
import { getBillingUsage } from "@/lib/billing/data";

export async function GET() {
  const auth = await requireCapability("billing");
  if ("error" in auth) return auth.error;

  return jsonOk(await getBillingUsage(auth));
}
