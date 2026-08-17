import { PKPass } from "passkit-generator";
import type { CardAppearance, LoyaltyProgram, Merchant, PointsConfig, PointsProgress, Progress, StampConfig, StampProgress, StepsConfig, StepsProgress } from "@/types";
import { renderPassFields } from "@/lib/wallet/renderPassFields";
import { loadAppleCertificates } from "@/lib/wallet/appleCerts";
import { ICON_PNG, ICON_2X_PNG, ICON_3X_PNG, LOGO_PNG, LOGO_2X_PNG } from "@/lib/wallet/assets";
import { getActiveStoreLocations } from "@/lib/wallet/locations";
import { resolveBrandColors } from "@/lib/wallet/colors";
import { appleBarcodeFormat } from "@/lib/wallet/barcode";
import {
  renderAppleStripImage,
  renderAppleStripCover,
  renderAppleStepsStrip,
  renderApplePointsStrip,
  renderMerchantIconAndLogo,
} from "@/lib/wallet/heroImage";

/** The strip is the only region of an Apple Wallet pass that can hold custom
 * graphics (see renderAppleStripImage) — without it, storeCard passes show
 * nothing but plain text fields on a flat background. Every program type now
 * gets a real progress visualization matching the dashboard's live preview
 * (stamp: circular grid, steps: milestone list, points: balance + bar) —
 * points/steps previously fell back to a plain cover photo with no progress
 * shown at all. Never fails pass generation — a missing decorative image is
 * better than no pass at all. */
async function buildStripBuffers(
  program: LoyaltyProgram,
  progress: Progress,
  primaryColor: string,
  secondaryColor: string
): Promise<{ "1x": Buffer; "2x": Buffer; "3x": Buffer } | null> {
  try {
    const config = program.config as CardAppearance;
    if (program.type === "stamp") {
      const stampConfig = program.config as StampConfig;
      const collected = (progress as StampProgress).stamps_collected;
      return await renderAppleStripImage({
        config: stampConfig,
        collected,
        primaryColor,
        secondaryColor,
        backgroundImageUrl: config.background_image_url,
        backgroundImagePosition: config.background_image_position,
      });
    }
    if (program.type === "steps") {
      return await renderAppleStepsStrip({
        config: program.config as StepsConfig,
        progress: progress as StepsProgress,
        primaryColor,
        secondaryColor,
        backgroundImageUrl: config.background_image_url,
        backgroundImagePosition: config.background_image_position,
      });
    }
    if (program.type === "points") {
      return await renderApplePointsStrip({
        config: program.config as PointsConfig,
        progress: progress as PointsProgress,
        primaryColor,
        secondaryColor,
        backgroundImageUrl: config.background_image_url,
        backgroundImagePosition: config.background_image_position,
      });
    }
    return await renderAppleStripCover(config.background_image_url, primaryColor, config.background_image_position);
  } catch (err) {
    console.error("[wallet:apple] strip image render failed", program.id, err);
    return null;
  }
}

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
  /** customer_progress.created_at — powers the card-expiration premium
   * feature's "N days remaining" field when the program has it enabled. */
  enrolledAt?: string;
}): Promise<{ buffer: Buffer; contentType: string; stub: boolean }> {
  const fields = renderPassFields(
    params.program.type,
    params.program.config,
    params.progress,
    params.merchant.business_name,
    params.enrolledAt
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
    const locations = await getActiveStoreLocations(params.merchant.id, params.program.id);

    const secondaryValue = fields.rewardAvailable
      ? `🎁 ${fields.secondaryValue} — Ready to redeem!`
      : fields.secondaryValue;
    const { primaryColor, secondaryColor } = resolveBrandColors(params.program, params.merchant);
    const strip = await buildStripBuffers(params.program, params.progress, primaryColor, secondaryColor);
    const brandIcon = await renderMerchantIconAndLogo(params.merchant.logo_url);

    const passJson = {
      formatVersion: 1,
      passTypeIdentifier,
      teamIdentifier,
      serialNumber: params.passId,
      organizationName: params.merchant.business_name || "WalletOS",
      description: `${params.program.name} — ${params.merchant.business_name}`,
      // logoText intentionally omitted: Apple renders it immediately to the
      // right of logo.png, which pulled the business name toward the left
      // side of the header next to the logo. Putting the name in
      // headerFields instead (below) — Apple always renders that at the
      // header's top-right corner — gives the logo-left/name-right split
      // the dashboard preview shows, which pass.json has no direct
      // "alignment" property for otherwise.
      webServiceURL: `${appUrl()}/api/wallet/apple`,
      authenticationToken: params.authenticationToken ?? params.passId,
      backgroundColor: hexToRgb(primaryColor, "rgb(62, 8, 86)"),
      foregroundColor: "rgb(255, 255, 255)",
      labelColor: hexToRgb(secondaryColor, "rgb(250, 174, 98)"),
      barcodes: [
        {
          format: appleBarcodeFormat((params.program.config as CardAppearance).barcode_style),
          message: params.passId,
          messageEncoding: "iso-8859-1",
        },
      ],
      // Phase 9: no customer app needed for proximity — PassKit natively
      // shows the pass on the lock screen when the device is physically
      // near these coordinates.
      ...(locations.length > 0 ? { locations } : {}),
      // Card expiration (premium): expirationDate makes iOS itself grey out
      // and eventually remove the pass, on top of the visible countdown
      // field below.
      ...(fields.expiry ? { expirationDate: fields.expiry.expiresAt.toISOString() } : {}),
      storeCard: {
        headerFields: [
          { key: "business", label: "", value: params.merchant.business_name || "" },
        ],
        // No primaryFields: Apple renders storeCard's primary field text
        // overlaid directly on top of the strip image, which collided with
        // the stamp grid now drawn into that same image (see strip image
        // above) — the grid itself already shows progress visually, so the
        // numeric counter is dropped rather than repositioned. secondary/
        // auxiliary render below the strip instead, matching the dashboard
        // live preview's info row (Reward | stamps-to-reward).
        primaryFields: [],
        secondaryFields: [
          { key: "secondary", label: fields.secondaryLabel, value: secondaryValue },
        ],
        auxiliaryFields: [
          { key: "auxiliary", label: fields.remainingLabel, value: fields.remainingValue },
          ...(fields.expiry
            ? [{ key: "expiry", label: fields.expiry.label, value: fields.expiry.value }]
            : []),
        ],
        backFields: [
          ...(params.program.config.details?.description
            ? [{ key: "details", label: "About", value: params.program.config.details.description }]
            : []),
          // Terms and website were being collected in the dashboard's Card
          // appearance form (CardDetails.terms/website) but never actually
          // reached the pass — only .description made it into backFields.
          ...(params.program.config.details?.terms
            ? [{ key: "terms", label: "Terms & conditions", value: params.program.config.details.terms }]
            : []),
          ...(params.program.config.details?.website
            ? [
                {
                  key: "website",
                  label: "Website",
                  value: params.program.config.details.website,
                  // PassKit backFields support this small HTML-anchor subset
                  // to render an actually-tappable link instead of plain text.
                  attributedValue: `<a href="${params.program.config.details.website}">${params.program.config.details.website}</a>`,
                },
              ]
            : []),
          // Apple's device-side notification check "compares the latest
          // version of the pass against the version it had before" for this
          // field's value — always including the field (even with an empty
          // placeholder on a brand-new pass) gives every real notification a
          // clean prior-value-to-new-value transition to detect. Making this
          // conditional on latestNotificationMessage being set meant a
          // customer's very first notification ever had no prior version of
          // this field to diff against, and could be missed.
          {
            key: "notification",
            label: "Latest update",
            value: params.latestNotificationMessage ?? "",
            changeMessage: "%@",
          },
        ],
      },
    };

    const pass = new PKPass(
      {
        "pass.json": Buffer.from(JSON.stringify(passJson)),
        // Merchant's own uploaded logo when they have one — the WalletOS
        // bundled artwork (lib/wallet/assets.ts) is only ever the fallback
        // now, not the default, for both the notification icon (icon.png)
        // and the in-card mark (logo.png).
        "icon.png": brandIcon?.icon["1x"] ?? ICON_PNG,
        "icon@2x.png": brandIcon?.icon["2x"] ?? ICON_2X_PNG,
        "icon@3x.png": brandIcon?.icon["3x"] ?? ICON_3X_PNG,
        "logo.png": brandIcon?.logo["1x"] ?? LOGO_PNG,
        "logo@2x.png": brandIcon?.logo["2x"] ?? LOGO_2X_PNG,
        ...(strip
          ? {
              "strip.png": strip["1x"],
              "strip@2x.png": strip["2x"],
              "strip@3x.png": strip["3x"],
            }
          : {}),
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

  try {
    const { sendApplePush } = await import("@/lib/wallet/apn");
    const topic = process.env.APPLE_PASS_TYPE_IDENTIFIER!;
    const results = await Promise.all(pushTokens.map((token) => sendApplePush(token, topic)));

    results.forEach((result, i) => {
      if (!result.ok) {
        console.error("[wallet:apple] push failed for token", pushTokens[i], result.error);
      }
    });

    return { ok: results.every((r) => r.ok), stub: false };
  } catch (err) {
    // Same defensive shape as google.ts's pushGooglePassUpdate — an
    // unexpected APNs/network error here must not reject the Promise.all in
    // pushWalletUpdate and take down the other platform's push (or the whole
    // notification-campaign delivery) with it.
    console.error("[wallet:apple] push update failed", passId, err);
    return { ok: false, stub: false };
  }
}
