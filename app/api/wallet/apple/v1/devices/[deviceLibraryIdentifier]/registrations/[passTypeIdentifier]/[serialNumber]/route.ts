import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Apple PassKit Web Service protocol:
// https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes
type Ctx = {
  params: Promise<{
    deviceLibraryIdentifier: string;
    passTypeIdentifier: string;
    serialNumber: string;
  }>;
};

async function isAuthorized(
  request: Request,
  admin: ReturnType<typeof createAdminClient>,
  serialNumber: string
) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("ApplePass ") ? header.slice("ApplePass ".length) : null;
  if (!token) return false;

  const { data } = await admin
    .from("customer_progress")
    .select("apple_auth_token")
    .eq("pass_id", serialNumber)
    .maybeSingle();

  return Boolean(data && data.apple_auth_token === token);
}

export async function POST(request: Request, { params }: Ctx) {
  const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = await params;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return new NextResponse(null, { status: 503 });
  }

  if (!(await isAuthorized(request, admin, serialNumber))) {
    return new NextResponse(null, { status: 401 });
  }

  const body = await request.json().catch(() => ({}) as { pushToken?: string });
  if (!body.pushToken) {
    return new NextResponse(null, { status: 400 });
  }

  const { data: existing } = await admin
    .from("apple_device_registrations")
    .select("id")
    .eq("device_library_identifier", deviceLibraryIdentifier)
    .eq("serial_number", serialNumber)
    .maybeSingle();

  const { error } = await admin.from("apple_device_registrations").upsert(
    {
      device_library_identifier: deviceLibraryIdentifier,
      pass_type_identifier: passTypeIdentifier,
      serial_number: serialNumber,
      push_token: body.pushToken,
    },
    { onConflict: "device_library_identifier,serial_number" }
  );

  if (error) {
    console.error("[wallet:apple:webservice] register failed", error.message);
    return new NextResponse(null, { status: 500 });
  }

  console.info("[wallet:apple:webservice] registered", { deviceLibraryIdentifier, serialNumber });
  return new NextResponse(null, { status: existing ? 200 : 201 });
}

export async function DELETE(request: Request, { params }: Ctx) {
  const { deviceLibraryIdentifier, serialNumber } = await params;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return new NextResponse(null, { status: 503 });
  }

  if (!(await isAuthorized(request, admin, serialNumber))) {
    return new NextResponse(null, { status: 401 });
  }

  await admin
    .from("apple_device_registrations")
    .delete()
    .eq("device_library_identifier", deviceLibraryIdentifier)
    .eq("serial_number", serialNumber);

  console.info("[wallet:apple:webservice] unregistered", { deviceLibraryIdentifier, serialNumber });
  return new NextResponse(null, { status: 200 });
}
