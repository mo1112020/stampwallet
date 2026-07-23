import { PKPass } from "passkit-generator";
import type { LoyaltyProgram, Merchant, Progress } from "@/types";
import { renderPassFields } from "@/lib/wallet/renderPassFields";
import { loadAppleCertificates } from "@/lib/wallet/appleCerts";
import { ICON_PNG, ICON_2X_PNG, ICON_3X_PNG, LOGO_PNG, LOGO_2X_PNG } from "@/lib/wallet/assets";

export function isAppleWalletConfigured() {
  return Boolean(
    process.env.APPLE_PASS_TYPE_IDENTIFIER &&
      process.env.APPLE_TEAM_IDENTIFIER &&
      process.env.APPLE_PASS_CERTIFICATE &&
      process.env.APPLE_WWDR_CERTIFICATE
  );
}

function hexToRgb(hex: string | undefined, fallback: string): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex ?? "");
  if (!match) return fallback;
  const int = parseInt(match[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgb(${r}, ${g}, ${b})`;
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function generateApplePass(params: {
  passId: string;
  program: LoyaltyProgram;
  merchant: Merchant;
  progress: Progress;
  authenticationToken?: string;
  /** Phase 8: latest notification text (customer_progress.latest_notification_message).
   * Embedded on a back-of-card field with changeMessage: "%@" — when this
   * value changes and the device re-fetches (after the APNs wake sent by
   * pushApplePassUpdate), iOS shows it as the lock-screen notification. */
  latestNotificationMessage?: string | null;
}): Promise<{ buffer: Buffer; contentType: string; stub: boolean }> {
  const fields = renderPassFields(
    params.program.type,
    params.program.config,
    params.progress,
    params.merchant.business_name
  );

  if (!isAppleWalletConfigured()) {
    const stub = Buffer.from(
      JSON.stringify(
        {
          stub: true,
          format: "pkpass-stub",
          passId: params.passId,
          fields,
          message:
            "Apple Wallet certificates not configured. Add env vars to generate real .pkpass files.",
        },
        null,
        2
      )
    );
    console.info("[wallet:apple] stub generate", params.passId);
    return { buffer: stub, contentType: "application/json", stub: true };
  }

  try {
    const certs = loadAppleCertificates();
    const passTypeIdentifier = process.env.APPLE_PASS_TYPE_IDENTIFIER!;
    const teamIdentifier = process.env.APPLE_TEAM_IDENTIFIER!;

    const secondaryValue = fields.rewardAvailable
      ? `🎁 ${fields.secondaryValue} — Ready to redeem!`
      : fields.secondaryValue;

    const passJson = {
      formatVersion: 1,
      passTypeIdentifier,
      teamIdentifier,
      serialNumber: params.passId,
      organizationName: params.merchant.business_name || "StampWallet",
      description: `${params.program.name} — ${params.merchant.business_name}`,
      logoText: params.merchant.business_name,
      webServiceURL: `${appUrl()}/api/wallet/apple`,
      authenticationToken: params.authenticationToken ?? params.passId,
      backgroundColor: hexToRgb(params.merchant.brand_color_primary, "rgb(62, 8, 86)"),
      foregroundColor: "rgb(255, 255, 255)",
      labelColor: hexToRgb(params.merchant.brand_color_secondary, "rgb(250, 174, 98)"),
      barcodes: [
        {
          format: "PKBarcodeFormatQR",
          message: params.passId,
          messageEncoding: "iso-8859-1",
        },
      ],
      storeCard: {
        headerFields: [],
        primaryFields: [
          { key: "primary", label: fields.primaryLabel, value: fields.primaryValue },
        ],
        secondaryFields: [
          { key: "secondary", label: fields.secondaryLabel, value: secondaryValue },
        ],
        auxiliaryFields: [
          { key: "auxiliary", label: fields.auxiliaryLabel, value: fields.auxiliaryValue },
        ],
        backFields: [
          ...(params.program.config.details?.description
            ? [{ key: "details", label: "About", value: params.program.config.details.description }]
            : []),
          ...(params.latestNotificationMessage
            ? [
                {
                  key: "notification",
                  label: "Latest update",
                  value: params.latestNotificationMessage,
                  changeMessage: "%@",
                },
              ]
            : []),
        ],
      },
    };

    const pass = new PKPass(
      {
        "pass.json": Buffer.from(JSON.stringify(passJson)),
        "icon.png": ICON_PNG,
        "icon@2x.png": ICON_2X_PNG,
        "icon@3x.png": ICON_3X_PNG,
        "logo.png": LOGO_PNG,
        "logo@2x.png": LOGO_2X_PNG,
      },
      {
        wwdr: certs.wwdr,
        signerCert: certs.signerCert,
        signerKey: certs.signerKeyPem,
      }
    );

    const buffer = pass.getAsBuffer();
    return { buffer, contentType: "application/vnd.apple.pkpass", stub: false };
  } catch (err) {
    console.error("[wallet:apple] real generation failed, falling back to stub", err);
    const stub = Buffer.from(
      JSON.stringify(
        {
          stub: true,
          format: "pkpass-stub",
          passId: params.passId,
          fields,
          message: err instanceof Error ? err.message : "Apple pass generation failed",
        },
        null,
        2
      )
    );
    return { buffer: stub, contentType: "application/json", stub: true };
  }
}

export async function pushApplePassUpdate(passId: string, pushTokens: string[]) {
  if (pushTokens.length === 0) {
    console.info("[wallet:apple] no push tokens for", passId);
    return { ok: true, stub: true };
  }
  if (!isAppleWalletConfigured()) {
    console.info("[wallet:apple] stub push update", passId);
    return { ok: true, stub: true };
  }

  const { sendApplePush } = await import("@/lib/wallet/apn");
  const topic = process.env.APPLE_PASS_TYPE_IDENTIFIER!;
  const results = await Promise.all(pushTokens.map((token) => sendApplePush(token, topic)));

  results.forEach((result, i) => {
    if (!result.ok) {
      console.error("[wallet:apple] push failed for token", pushTokens[i], result.error);
    }
  });

  return { ok: results.every((r) => r.ok), stub: false };
}
