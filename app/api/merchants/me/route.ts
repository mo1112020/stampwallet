import { jsonOk, requireSession } from "@/lib/api";

export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  return jsonOk(auth.merchant);
}
