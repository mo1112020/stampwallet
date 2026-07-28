import jwt from "jsonwebtoken";
import type { JWT } from "google-auth-library";
import type { CardAppearance, LoyaltyProgram, Merchant, Progress } from "@/types";
import { renderPassFields, type PassFields } from "@/lib/wallet/renderPassFields";
import { getServiceAccount, getWalletClient } from "@/lib/wallet/googleAuth";
import { getActiveStoreLocations } from "@/lib/wallet/locations";
import { createAdminClient } from "@/lib/supabase/admin";

const WALLET_API = "https://walletobjects.googleapis.com/walletobjects/v1";

export function isGoogleWalletConfigured() {
  return Boolean(process.env.GOOGLE_WALLET_ISSUER_ID && process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY);
}

function buildClassId(programId: string) {
  return `${process.env.GOOGLE_WALLET_ISSUER_ID}.program_${programId}`;
}

function buildObjectId(passId: string) {
  return `${process.env.GOOGLE_WALLET_ISSUER_ID}.pass_${passId}`;
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function isConflict(err: unknown) {
  const status = (err as { response?: { status?: number }; status?: number } | undefined);
  return status?.response?.status === 409 || status?.status === 409;
}

async function upsertResource(client: JWT, collection: "loyaltyClass" | "loyaltyObject", id: string, payload: object) {
  try {
    await client.request({ url: `${WALLET_API}/${collection}`, method: "POST", data: payload });
  } catch (err) {
    if (!isConflict(err)) throw err;
    await client.request({ url: `${WALLET_API}/${collection}/${id}`, method: "PATCH", data: payload });
  }
}

async function loyaltyObjectFields(
  passId: string,
  classId: string,
  fields: PassFields,
  merchantId: string,
  programId: string
) {
  const secondaryValue = fields.rewardAvailable
    ? `🎁 ${fields.secondaryValue} — Ready to redeem!`
    : fields.secondaryValue;
  const locations = await getActiveStoreLocations(merchantId, programId);

  return {
    classId,
    state: "ACTIVE",
    accountId: passId,
    accountName: fields.auxiliaryValue,
    loyaltyPoints: {
      label: fields.primaryLabel,
      balance: { string: fields.primaryValue },
    },
    textModulesData: [
      // `id` lets the class's cardTemplateOverride reference this module by
      // fieldPath ("object.textModulesData['reward']") to promote it onto
      // the front of the card — otherwise Google's default template only
      // shows loyaltyPoints + barcode on the front and buries every text
      // module behind "tap for details".
      { id: "reward", header: fields.secondaryLabel, body: secondaryValue },
      ...(fields.expiry ? [{ id: "expiry", header: fields.expiry.label, body: fields.expiry.value }] : []),
    ],
    barcode: { type: "QR_CODE", value: passId, alternateText: passId },
    // Phase 9: no customer app needed — Google Wallet natively surfaces
    // the pass when the device is physically near these coordinates.
    ...(locations.length > 0
      ? { locations: locations.map((l) => ({ latitude: l.latitude, longitude: l.longitude })) }
      : {}),
    // Card expiration (premium): Google Wallet stops showing the pass as
    // active past this date, mirroring Apple's expirationDate.
    ...(fields.expiry
      ? { validTimeInterval: { end: { date: fields.expiry.expiresAt.toISOString() } } }
      : {}),
  };
}

export async function generateGoogleWalletLink(params: {
  passId: string;
  program: LoyaltyProgram;
  merchant: Merchant;
  progress: Progress;
  /** customer_progress.created_at — powers the card-expiration premium feature. */
  enrolledAt?: string;
}): Promise<{ saveUrl: string; stub: boolean; objectId?: string }> {
  const fields = renderPassFields(
    params.program.type,
    params.program.config,
    params.progress,
    params.merchant.business_name,
    params.enrolledAt
  );

  if (!isGoogleWalletConfigured()) {
    console.info("[wallet:google] stub link", params.passId);
    // `saveUrl` is intentionally empty — callers must check `stub` before
    // treating this as a real link (both wallet/google/[passId]/route.ts and
    // customers/enroll/route.ts do); there's no local fallback page to point
    // to here anymore.
    return { saveUrl: "", stub: true };
  }

  try {
    const account = getServiceAccount();
    const client = getWalletClient();
    const classId = buildClassId(params.program.id);
    const objectId = buildObjectId(params.passId);
    // Same field the dashboard's Print/Preview cover photo and the
    // enrollment page pull from (CardAppearance.background_image_url) —
    // it's already a public HTTPS URL out of the `card-backgrounds`
    // Supabase Storage bucket, so it's usable as-is for Google's heroImage.
    const backgroundImageUrl = (params.program.config as CardAppearance).background_image_url;
    const website = (params.program.config as CardAppearance).details?.website;

    await upsertResource(client, "loyaltyClass", classId, {
      id: classId,
      issuerName: params.merchant.business_name || "WalletOS",
      programName: params.program.name,
      reviewStatus: "UNDER_REVIEW",
      hexBackgroundColor: /^#[0-9a-f]{6}$/i.test(params.merchant.brand_color_primary)
        ? params.merchant.brand_color_primary
        : "#3E0856",
      // Google rejects loyaltyClass creation outright ("cannot be created
      // without a program logo") if this is missing — it's not optional the
      // way it looks. Falls back to WalletOS's own hosted icon for
      // merchants who haven't uploaded a business logo yet, so enrollment
      // never silently fails for that reason.
      programLogo: {
        sourceUri: { uri: params.merchant.logo_url || `${appUrl()}/brand/icon-only.png` },
      },
      // Banner image across the top of the card — this is the direct
      // equivalent of the cover photo in the WalletOS preview. Omitted (not
      // sent as a broken/empty sourceUri) when the merchant hasn't set one,
      // since Google validates the URL and an empty string 400s the class.
      ...(backgroundImageUrl ? { heroImage: { sourceUri: { uri: backgroundImageUrl } } } : {}),
      // Promotes the reward textModulesData entry (set with id: "reward" in
      // loyaltyObjectFields below) from the details view onto the front of
      // the card, matching where the WalletOS preview shows it. Google's
      // default template (no classTemplateInfo) only puts loyaltyPoints +
      // barcode on the front.
      classTemplateInfo: {
        cardTemplateOverride: {
          cardRowTemplateInfos: [
            { oneItem: { item: { firstValue: { fields: [{ fieldPath: "object.textModulesData['reward']" }] } } } },
          ],
        },
      },
      ...(website ? { linksModuleData: { uris: [{ uri: website, description: "Visit website", id: "website" }] } } : {}),
    });

    await upsertResource(
      client,
      "loyaltyObject",
      objectId,
      { id: objectId, ...(await loyaltyObjectFields(params.passId, classId, fields, params.merchant.id, params.program.id)) }
    );

    try {
      const admin = createAdminClient();
      await admin.from("customer_progress").update({ google_object_id: objectId }).eq("pass_id", params.passId);
    } catch {
      // No service role configured in this environment — the object still
      // exists on Google's side, just won't be push-updatable until the
      // next call to generateGoogleWalletLink re-links it.
    }

    const saveToken = jwt.sign(
      {
        iss: account.client_email,
        aud: "google",
        typ: "savetowallet",
        payload: { loyaltyObjects: [{ id: objectId }] },
      },
      account.private_key,
      { algorithm: "RS256" }
    );

    return { saveUrl: `https://pay.google.com/gp/v/save/${saveToken}`, stub: false, objectId };
  } catch (err) {
    console.error("[wallet:google] real link generation failed, falling back to stub", err);
    return { saveUrl: "", stub: true };
  }
}

export async function pushGooglePassUpdate(
  passId: string,
  googleObjectId: string | null,
  program: LoyaltyProgram,
  merchant: Merchant,
  progress: Progress,
  /** Phase 8: appends a real Google Wallet message (header/body banner
   * shown in-app) rather than just refreshing the points/progress fields. */
  notification?: { title: string; message: string } | null,
  /** customer_progress.created_at — powers the card-expiration premium feature. */
  enrolledAt?: string
) {
  if (!isGoogleWalletConfigured()) {
    console.info("[wallet:google] stub patch", passId, googleObjectId);
    return { ok: true, stub: true };
  }
  if (!googleObjectId) {
    console.info("[wallet:google] no google object id yet for", passId);
    return { ok: true, stub: true };
  }

  try {
    const client = getWalletClient();
    const fields = renderPassFields(program.type, program.config, progress, merchant.business_name, enrolledAt);
    const secondaryValue = fields.rewardAvailable
      ? `🎁 ${fields.secondaryValue} — Ready to redeem!`
      : fields.secondaryValue;
    const locations = await getActiveStoreLocations(merchant.id, program.id);

    await client.request({
      url: `${WALLET_API}/loyaltyObject/${googleObjectId}`,
      method: "PATCH",
      data: {
        loyaltyPoints: { label: fields.primaryLabel, balance: { string: fields.primaryValue } },
        // `id`s must match loyaltyObjectFields above — the class's
        // cardTemplateOverride references "reward" by fieldPath, and PATCH
        // replaces this array wholesale, so dropping the id here would
        // silently break the front-of-card row on the very next stamp/point
        // update after pass creation.
        textModulesData: [
          { id: "reward", header: fields.secondaryLabel, body: secondaryValue },
          ...(fields.expiry ? [{ id: "expiry", header: fields.expiry.label, body: fields.expiry.value }] : []),
        ],
        ...(locations.length > 0
          ? { locations: locations.map((l) => ({ latitude: l.latitude, longitude: l.longitude })) }
          : {}),
        ...(fields.expiry
          ? { validTimeInterval: { end: { date: fields.expiry.expiresAt.toISOString() } } }
          : {}),
        ...(notification
          ? {
              messages: [
                {
                  header: notification.title,
                  body: notification.message,
                  id: `notif-${Date.now()}`,
                },
              ],
            }
          : {}),
      },
    });
    return { ok: true, stub: false };
  } catch (err) {
    console.error("[wallet:google] push patch failed", passId, err);
    return { ok: false, stub: false };
  }
}
