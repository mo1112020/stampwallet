import jwt from "jsonwebtoken";
import type { JWT } from "google-auth-library";
import type { LoyaltyProgram, Merchant, Progress } from "@/types";
import { renderPassFields, type PassFields } from "@/lib/wallet/renderPassFields";
import { getServiceAccount, getWalletClient } from "@/lib/wallet/googleAuth";
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

function loyaltyObjectFields(passId: string, classId: string, fields: PassFields) {
  const secondaryValue = fields.rewardAvailable
    ? `🎁 ${fields.secondaryValue} — Ready to redeem!`
    : fields.secondaryValue;

  return {
    classId,
    state: "ACTIVE",
    accountId: passId,
    accountName: fields.auxiliaryValue,
    loyaltyPoints: {
      label: fields.primaryLabel,
      balance: { string: fields.primaryValue },
    },
    textModulesData: [{ header: fields.secondaryLabel, body: secondaryValue }],
    barcode: { type: "QR_CODE", value: passId, alternateText: passId },
  };
}

export async function generateGoogleWalletLink(params: {
  passId: string;
  program: LoyaltyProgram;
  merchant: Merchant;
  progress: Progress;
}): Promise<{ saveUrl: string; stub: boolean; objectId?: string }> {
  const fields = renderPassFields(
    params.program.type,
    params.program.config,
    params.progress,
    params.merchant.business_name
  );

  if (!isGoogleWalletConfigured()) {
    console.info("[wallet:google] stub link", params.passId);
    return {
      saveUrl: `/pass/${params.passId}?wallet=google-stub&primary=${encodeURIComponent(fields.primaryValue)}`,
      stub: true,
    };
  }

  try {
    const account = getServiceAccount();
    const client = getWalletClient();
    const classId = buildClassId(params.program.id);
    const objectId = buildObjectId(params.passId);

    await upsertResource(client, "loyaltyClass", classId, {
      id: classId,
      issuerName: params.merchant.business_name || "StampWallet",
      programName: params.program.name,
      reviewStatus: "UNDER_REVIEW",
      hexBackgroundColor: /^#[0-9a-f]{6}$/i.test(params.merchant.brand_color_primary)
        ? params.merchant.brand_color_primary
        : "#3E0856",
      ...(params.merchant.logo_url
        ? { programLogo: { sourceUri: { uri: params.merchant.logo_url } } }
        : {}),
    });

    await upsertResource(
      client,
      "loyaltyObject",
      objectId,
      { id: objectId, ...loyaltyObjectFields(params.passId, classId, fields) }
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
    return {
      saveUrl: `/pass/${params.passId}?wallet=google-stub&primary=${encodeURIComponent(fields.primaryValue)}`,
      stub: true,
    };
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
  notification?: { title: string; message: string } | null
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
    const fields = renderPassFields(program.type, program.config, progress, merchant.business_name);
    const secondaryValue = fields.rewardAvailable
      ? `🎁 ${fields.secondaryValue} — Ready to redeem!`
      : fields.secondaryValue;

    await client.request({
      url: `${WALLET_API}/loyaltyObject/${googleObjectId}`,
      method: "PATCH",
      data: {
        loyaltyPoints: { label: fields.primaryLabel, balance: { string: fields.primaryValue } },
        textModulesData: [{ header: fields.secondaryLabel, body: secondaryValue }],
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
