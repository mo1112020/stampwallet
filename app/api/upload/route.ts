import { NextRequest, NextResponse } from "next/server";
import { requireMerchant } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const auth = await requireMerchant();
  if ("error" in auth) return auth.error;
  const { supabase, userId } = auth;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Please upload a JPG, PNG, or WebP image" }, { status: 400 });
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File size must be under 5MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${userId}/${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  // Upload through the server client when available. This avoids browser-session
  // RLS failures and lets a fresh installation create its image bucket safely.
  let storage = supabase;
  let hasAdminStorage = false;
  try {
    storage = createAdminClient();
    hasAdminStorage = true;
  } catch {
    // The authenticated client still works when the storage migration has run.
  }

  const bucketName = "card-backgrounds";
  if (hasAdminStorage) {
    const { error: bucketError } = await storage.storage.getBucket(bucketName);
    if (bucketError) {
    const { error: createBucketError } = await storage.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: allowedTypes,
    });
    if (createBucketError && !createBucketError.message.toLowerCase().includes("already exists")) {
      return NextResponse.json({ error: `Could not prepare image storage: ${createBucketError.message}` }, { status: 500 });
    }
    }
  }

  const { error } = await storage.storage
    .from("card-backgrounds")
    .upload(fileName, bytes, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    const setupHint = !hasAdminStorage && /bucket|storage|policy|permission/i.test(error.message)
      ? " Add SUPABASE_SERVICE_ROLE_KEY to enable automatic storage setup, or apply migration 002_card_backgrounds_storage.sql."
      : "";
    return NextResponse.json({ error: `${error.message}${setupHint}` }, { status: 500 });
  }

  const { data: publicUrl } = storage.storage
    .from("card-backgrounds")
    .getPublicUrl(fileName);

  return NextResponse.json({ url: publicUrl.publicUrl });
}
