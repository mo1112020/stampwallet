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

  let query = admin.from("customer_progress").select("pass_id, updated_at").in("pass_id", serialNumbers);

  if (updatedSince) {
    const since = new Date(updatedSince);
    if (!Number.isNaN(since.getTime())) {
      query = query.gt("updated_at", since.toISOString());
    }
  }

  const { data: updated } = await query;

  if (!updated || updated.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  const lastUpdated = updated.reduce(
    (max, row) => ((row.updated_at as string) > max ? (row.updated_at as string) : max),
    updated[0].updated_at as string
  );

  return NextResponse.json({
    lastUpdated,
    serialNumbers: updated.map((row) => row.pass_id as string),
  });
}
