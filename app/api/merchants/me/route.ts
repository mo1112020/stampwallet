import { jsonOk, requireMerchant } from "@/lib/api";

export async function GET() {
  const auth = await requireMerchant();
  if ("error" in auth) return auth.error;
  return jsonOk(auth.merchant);
}
