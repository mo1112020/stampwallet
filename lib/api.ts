import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Merchant } from "@/types";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function jsonError(message: string, code: string, status: number) {
  return NextResponse.json({ error: { message, code } }, { status });
}

export async function requireMerchant(): Promise<
  | { supabase: Awaited<ReturnType<typeof createClient>>; merchant: Merchant; userId: string }
  | { error: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: jsonError("Unauthorized", "unauthorized", 401) };
  }

  const { data: merchant, error } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !merchant) {
    return { error: jsonError("Merchant not found", "merchant_not_found", 401) };
  }

  return { supabase, merchant: merchant as Merchant, userId: user.id };
}
