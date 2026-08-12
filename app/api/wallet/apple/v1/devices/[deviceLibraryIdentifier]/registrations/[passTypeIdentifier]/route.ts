import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Ctx = {
  params: Promise<{ deviceLibraryIdentifier: string; passTypeIdentifier: string }>;
};

// Apple polls this to find which of a device's registered passes changed
// since the last check, using the opaque `lastUpdated` tag this endpoint
// previously returned (we use an ISO timestamp for that tag).
export async function GET(request: Request, { params }: Ctx) {
  const { deviceLibraryIdentifier, passTypeIdentifier } = await params;
  const updatedSince = new URL(request.url).searchParams.get("passesUpdatedSince");

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return new NextResponse(null, { status: 503 });
  }

  const { data: registrations } = await admin
    .from("apple_device_registrations")
    .select("serial_number")
    .eq("device_library_identifier", deviceLibraryIdentifier)
    .eq("pass_type_identifier", passTypeIdentifier);

  const serialNumbers = (registrations ?? []).map((row) => row.serial_number as string);
  if (serialNumbers.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  // Same three-signal freshness as the per-pass GET route
  // (app/api/wallet/apple/v1/passes/[passTypeIdentifier]/[serialNumber]/route.ts)
  // — this endpoint only ever compared customer_progress.updated_at, so a
  // program/branding-only edit (or a code-only rendering fix, bumped here
  // manually) never appeared in this "what changed" list at all, and the
  // device never even attempted the per-pass fetch that *would* have served
  // fresh content. Confirmed in production via Apple's own "pass was
  // unchanged" diagnostic even after the per-pass route's fix shipped.
  const { data: rows } = await admin
    .from("customer_progress")
    .select("pass_id, updated_at, loyalty_programs(updated_at, merchants(updated_at))")
    .in("pass_id", serialNumbers);

  const effective = (rows ?? []).map((row) => {
    const program = row.loyalty_programs as unknown as { updated_at: string; merchants: { updated_at: string } } | null;
    const lastModified = [row.updated_at as string, program?.updated_at, program?.merchants?.updated_at]
      .filter((v): v is string => Boolean(v))
      .reduce((max, v) => (v > max ? v : max));
    return { passId: row.pass_id as string, lastModified };
  });

  const since = updatedSince ? new Date(updatedSince) : null;
  const updated =
    since && !Number.isNaN(since.getTime())
      ? effective.filter((row) => new Date(row.lastModified).getTime() > since.getTime())
      : effective;

  if (updated.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  const lastUpdated = updated.reduce(
    (max, row) => (row.lastModified > max ? row.lastModified : max),
    updated[0].lastModified
  );

  return NextResponse.json({
    lastUpdated,
    serialNumbers: updated.map((row) => row.passId),
  });
}
