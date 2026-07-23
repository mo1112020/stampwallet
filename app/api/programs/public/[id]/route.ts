import { jsonError, jsonOk } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

// The enrollment page is intentionally public. Return only the branding needed
// to render it, never merchant account or billing data.
export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonError("Server is not configured", "misconfigured", 503);
  }

  const { data, error } = await admin
    .from("loyalty_programs")
    .select("id, name, type, config, merchants(business_name, logo_url, brand_color_primary, brand_color_secondary)")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error || !data) return jsonError("Program not found", "not_found", 404);
  return jsonOk(data);
}
