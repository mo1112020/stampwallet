import jwt from "jsonwebtoken";
import type { JWT } from "google-auth-library";
import type { BarcodeStyle, CardAppearance, CardDetails, LoyaltyProgram, Merchant, PointsConfig, PointsProgress, Progress, StampConfig, StampProgress, StepsConfig, StepsProgress } from "@/types";
import { googleBarcodeType } from "@/lib/wallet/barcode";
import { renderPassFields, type PassFields } from "@/lib/wallet/renderPassFields";
import { getServiceAccount, getWalletClient } from "@/lib/wallet/googleAuth";
import { getActiveStoreLocations } from "@/lib/wallet/locations";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  renderCoverHeroImage,
  renderStampCardHeroImage,
  renderStepsCardHeroImage,
  renderPointsCardHeroImage,
  uploadHeroImage,
} from "@/lib/wallet/heroImage";
import { resolveBrandColors } from "@/lib/wallet/colors";

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

/** Google Wallet has no native progress field for any program type, so the
 * object's heroImage IS the progress indicator — regenerated and
 * re-uploaded every time this runs (enrollment, and every scan/notification
 * push via pushGooglePassUpdate) so the card always shows current progress,
 * matching the dashboard's live preview for all three program types (stamp:
 * grid, steps: milestone list, points: balance + bar). Points/steps
 * previously fell through to undefined here and kept whatever plain
 * cover-photo heroImage the class provided at enrollment — no progress
 * shown at all. Returns undefined (leaving heroImage untouched) if
 * generation/upload fails, since a stale progress image is better than
 * failing the whole pass update. */
async function objectHeroImage(
  passId: string,
  program: LoyaltyProgram,
  progress: Progress,
  primaryColor: string,
  secondaryColor: string
): Promise<string | undefined> {
  try {
    const config = program.config as CardAppearance;
    let buffer: Buffer;
    let key: string;
    if (program.type === "stamp") {
      buffer = await renderStampCardHeroImage({
        config: config as StampConfig,
        collected: (progress as StampProgress).stamps_collected,
        primaryColor,
        secondaryColor,
        backgroundImageUrl: config.background_image_url,
        backgroundImagePosition: config.background_image_position,
      });
      key = `stamp-${passId}`;
    } else if (program.type === "steps") {
      buffer = await renderStepsCardHeroImage({
        config: config as StepsConfig,
        progress: progress as StepsProgress,
        primaryColor,
        secondaryColor,
        backgroundImageUrl: config.background_image_url,
        backgroundImagePosition: config.background_image_position,
      });
      key = `steps-${passId}`;
    } else {
      buffer = await renderPointsCardHeroImage({
        config: config as PointsConfig,
        progress: progress as PointsProgress,
        primaryColor,
        secondaryColor,
        backgroundImageUrl: config.background_image_url,
        backgroundImagePosition: config.background_image_position,
      });
      key = `points-${passId}`;
    }
    const url = await uploadHeroImage(key, buffer);
    return url ?? undefined;
  } catch (err) {
    console.error("[wallet:google] object hero image render failed", passId, err);
    return undefined;
  }
}

/** Card appearance's "About"/"Terms" text and "Website" link were being
 * collected in the dashboard form (CardDetails.description/terms/website)
 * but only .description ever reached the pass, and only on Apple — Google
 * never received any of the three. These render in the tap-through
 * "Details" view (Google never promotes them to the front, matching where
 * the dashboard's own "these appear under More details" copy says they
 * should live), and are object-level (not class-level) so they refresh on
 * every ordinary push in pushGooglePassUpdate below instead of only at
 * first enrollment. */
function detailModules(details: CardDetails | undefined) {
  const textModulesData = [
    ...(details?.description ? [{ id: "details", header: "About", body: details.description }] : []),
    ...(details?.terms ? [{ id: "terms", header: "Terms & conditions", body: details.terms }] : []),
  ];
  const linksModuleData = details?.website
    ? { uris: [{ uri: details.website, description: "Visit website", id: "website" }] }
    : undefined;
  return { textModulesData, linksModuleData };
}

async function loyaltyObjectFields(
  passId: string,
  classId: string,
  fields: PassFields,
  merchantId: string,
  programId: string,
  heroImageUrl: string | undefined,
  barcodeStyle: BarcodeStyle | undefined,
  details: CardDetails | undefined
) {
  const secondaryValue = fields.rewardAvailable
    ? `🎁 ${fields.secondaryValue} — Ready to redeem!`
    : fields.secondaryValue;
  const locations = await getActiveStoreLocations(merchantId, programId);
  const { textModulesData: detailTextModules, linksModuleData } = detailModules(details);

  return {
    classId,
    state: "ACTIVE",
    accountId: passId,
    accountName: fields.auxiliaryValue,
    // Same reasoning as apple.ts: the heroImage now draws the stamp grid
    // itself, so loyaltyPoints (Google's own prominent counter) is
    // repurposed to the same non-numeric "left to reward" phrasing used in
    // Apple's auxiliary field and the dashboard preview's info row, instead
    // of a redundant raw "X / Y" count.
    loyaltyPoints: {
      label: fields.remainingLabel,
      balance: { string: fields.remainingValue },
    },
    textModulesData: [
      // `id` lets the class's cardTemplateOverride reference this module by
      // fieldPath ("object.textModulesData['reward']") to promote it onto
      // the front of the card — otherwise Google's default template only
      // shows loyaltyPoints + barcode on the front and buries every text
      // module behind "tap for details".
      { id: "reward", header: fields.secondaryLabel, body: secondaryValue },
      ...(fields.expiry ? [{ id: "expiry", header: fields.expiry.label, body: fields.expiry.value }] : []),
      ...detailTextModules,
    ],
    ...(linksModuleData ? { linksModuleData } : {}),
    barcode: { type: googleBarcodeType(barcodeStyle), value: passId, alternateText: passId },
    // Object-level heroImage overrides the class-level one — this is how a
    // per-customer stamp-progress image can be shown while every other
    // customer's (and the class's own default) heroImage stays untouched.
    ...(heroImageUrl ? { heroImage: { sourceUri: { uri: heroImageUrl } } } : {}),
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
    const { primaryColor, secondaryColor } = resolveBrandColors(params.program, params.merchant);
    // Same field the dashboard's Print/Preview cover photo and the
    // enrollment page pull from (CardAppearance.background_image_url).
    const backgroundImageUrl = (params.program.config as CardAppearance).background_image_url;
    const backgroundImagePosition = (params.program.config as CardAppearance).background_image_position;
    const website = (params.program.config as CardAppearance).details?.website;
    const barcodeStyle = (params.program.config as CardAppearance).barcode_style;

    // Pre-composited to Google's documented heroImage canvas (1032x812,
    // ~5:4) with the same darkening treatment the WalletOS preview uses —
    // sending the raw merchant upload as-is left Google's own auto-fit to
    // crop/frame it however it chose, which is what produced a hero image
    // that didn't match the preview's framing.
    const classHeroImageUrl = backgroundImageUrl
      ? await uploadHeroImage(
          `class-${params.program.id}`,
          await renderCoverHeroImage(backgroundImageUrl, primaryColor, backgroundImagePosition)
        )
      : null;

    await upsertResource(client, "loyaltyClass", classId, {
      id: classId,
      issuerName: params.merchant.business_name || "WalletOS",
      programName: params.program.name,
      reviewStatus: "UNDER_REVIEW",
      hexBackgroundColor: primaryColor,
      // Google rejects loyaltyClass creation outright ("cannot be created
      // without a program logo") if this is missing — it's not optional the
      // way it looks. Falls back to WalletOS's own hosted icon for
      // merchants who haven't uploaded a business logo yet, so enrollment
      // never silently fails for that reason.
      programLogo: {
        sourceUri: { uri: params.merchant.logo_url || `${appUrl()}/brand/icon-only.png` },
      },
      // Banner image across the top of the card — the direct equivalent of
      // the cover photo in the WalletOS preview. Omitted (not sent as a
      // broken/empty sourceUri) when there's no cover photo and rendering it
      // failed, since Google validates the URL and an empty string 400s the
      // class. For stamp-type programs this is overridden per-customer by
      // the object-level progress image below.
      ...(classHeroImageUrl ? { heroImage: { sourceUri: { uri: classHeroImageUrl } } } : {}),
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

    const objectHeroImageUrl = await objectHeroImage(params.passId, params.program, params.progress, primaryColor, secondaryColor);

    await upsertResource(
      client,
      "loyaltyObject",
      objectId,
      {
        id: objectId,
        ...(await loyaltyObjectFields(
          params.passId,
          classId,
          fields,
          params.merchant.id,
          params.program.id,
          objectHeroImageUrl,
          barcodeStyle,
          (params.program.config as CardAppearance).details
        )),
      }
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
  enrolledAt?: string,
  /** See lib/wallet/push.ts's pushWalletUpdate — true when `progress` is
   * definitely unchanged from what's already on the card (a notification
   * with no accompanying scan). Skips the image render+upload below
   * entirely rather than regenerating an identical image. */
  skipHeroImageRefresh?: boolean,
  /** True only for the branding/program-edit broadcast (see
   * pushProgramUpdateToAllCustomers) — every OTHER caller (a scan, a
   * notification-campaign send, the expiration cron) leaves this false so
   * the loyaltyClass PATCH below is skipped entirely.
   *
   * This used to run unconditionally on every single push of any kind,
   * which means the shared loyaltyClass (one row per PROGRAM, not per
   * customer) had its reviewStatus forced back to UNDER_REVIEW on every
   * scan and every notification send for every enrolled customer — for an
   * active program that's dozens/hundreds of times a day. Per Google's own
   * Wallet Objects API field docs, resending UNDER_REVIEW on a PATCH to an
   * already-approved class IS required (confirmed by the real 400 the
   * comment below documents) and Google's platform is supposed to
   * auto-flip it back to APPROVED — but re-arming that on essentially
   * every request, forever, for an actively-used program never gives it a
   * chance to sit in APPROVED for any length of time, which lines up
   * exactly with "the class-level logo push happens but customers never
   * see it" while object-level fields (progress, notification messages —
   * which live on loyaltyObject, not loyaltyClass, and aren't touched by
   * this flag) update fine. Only firing this when branding/program content
   * has actually changed lets the class settle into APPROVED between real
   * edits instead of being perpetually re-triggered.
   *
   * Left the reviewStatus VALUE itself untouched (still "UNDER_REVIEW",
   * not e.g. "APPROVED") — the previous fix's 400 error is real evidence
   * that Google rejects a PATCH from an approved class without it, and
   * flipping it the other way on a guess risks a hard regression (push
   * failures) that's worse than a stale logo. If the logo is STILL not
   * reaching devices after this change, the next step is checking this
   * program's class directly in Google Wallet Business Console to see
   * whether it's stuck in UNDER_REVIEW (would mean Google's review here
   * isn't the fast/automated kind for this account and needs a manual nudge
   * from Google) rather than guessing further from this side. */
  refreshClass?: boolean
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
    const { primaryColor, secondaryColor } = resolveBrandColors(program, merchant);
    // Every stamp/point update regenerates and re-uploads the progress
    // image so the pass reflects current progress — undefined (rather than
    // an empty heroImage) leaves the previous image in place if this fails,
    // instead of blanking out a working banner over a decorative miss.
    // skipHeroImageRefresh (set for pure notification sends — a campaign or
    // cron trigger never carries changed progress) skips this the same way:
    // omitting `heroImage` from the PATCH body below leaves whatever image
    // is already on the object untouched, and this was by a wide margin the
    // single most expensive step in the whole push (fetch + render + a
    // second network round trip to upload it) for output that would have
    // been byte-identical to what's already there.
    const heroImageUrl = skipHeroImageRefresh
      ? undefined
      : await objectHeroImage(passId, program, progress, primaryColor, secondaryColor);
    const { textModulesData: detailTextModules, linksModuleData } = detailModules(
      (program.config as CardAppearance).details
    );

    // Fields that live on the loyaltyClass (shared by every customer on this
    // program), not the per-customer loyaltyObject PATCHed below —
    // programLogo, issuerName, and the website link were only ever written
    // once, at first enrollment (generateGoogleWalletLink's class upsert).
    // A merchant uploading/changing their logo, renaming the business, or
    // editing the website after that first customer had already enrolled
    // never reached any already-issued card: the notification icon and the
    // in-card mark kept showing whatever was true (often nothing —
    // WalletOS's own fallback icon) at enrollment time, forever. Re-sent
    // here on every push, same as the object fields above. Deliberately
    // excludes classHeroImageUrl — that needs an image render+upload
    // (renderCoverHeroImage), which would double the already-heavy per-push
    // cost (see the 45s timeout comment in lib/wallet/push.ts) for a field
    // that only matters for points/steps programs' cover photo.
    // Not awaited immediately — kicked off alongside the object PATCH below
    // and awaited together (Promise.all further down) so both requests run
    // concurrently, but this function still can't return (and risk a
    // serverless freeze cutting it off mid-flight) until both have actually
    // settled. Gated by `refreshClass` (see param doc above) — only actually
    // sent for the branding/program-edit broadcast, a no-op Promise for
    // every routine scan/notification push.
    const classRefresh = !refreshClass
      ? Promise.resolve()
      : client
          .request({
            url: `${WALLET_API}/loyaltyClass/${buildClassId(program.id)}`,
            method: "PATCH",
            data: {
              issuerName: merchant.business_name || "WalletOS",
              programName: program.name,
              programLogo: { sourceUri: { uri: merchant.logo_url || `${appUrl()}/brand/icon-only.png` } },
              ...(linksModuleData ? { linksModuleData } : {}),
              // Required on every class write, not just the initial create in
              // generateGoogleWalletLink — omitting it here is what a live test
              // caught as a hard 400 ("Invalid review status 'APPROVED'. Use
              // 'UNDER_REVIEW' instead.") against a class Google had already
              // approved: Google won't accept a PATCH that leaves reviewStatus
              // implicit once a class has moved past UNDER_REVIEW.
              reviewStatus: "UNDER_REVIEW",
            },
          })
          .catch((err) => {
            // Non-fatal — the per-customer object PATCH below (progress, the
            // notification banner itself) is what actually matters for this
            // push; a stale class-level logo/name is a lesser miss, not worth
            // failing the whole update over.
            console.error("[wallet:google] class refresh failed", program.id, err);
          });

    await Promise.all([
      classRefresh,
      client.request({
        url: `${WALLET_API}/loyaltyObject/${googleObjectId}`,
        method: "PATCH",
        data: {
        // Must match loyaltyObjectFields above (used at enrollment) — this
        // PATCH re-sends loyaltyPoints wholesale on every scan/notification
        // push, so using the old primaryLabel/primaryValue here silently
        // reverted the card back to the raw "X / Y" counter on the very
        // first push after enrollment.
        loyaltyPoints: { label: fields.remainingLabel, balance: { string: fields.remainingValue } },
        // Re-sent on every push (not just at enrollment) so a merchant
        // changing their barcode style later is reflected on passes
        // already saved to a customer's device, not just new enrollments.
        barcode: { type: googleBarcodeType((program.config as CardAppearance).barcode_style), value: passId, alternateText: passId },
        // `id`s must match loyaltyObjectFields above — the class's
        // cardTemplateOverride references "reward" by fieldPath, and PATCH
        // replaces this array wholesale, so dropping the id here would
        // silently break the front-of-card row on the very next stamp/point
        // update after pass creation. detailTextModules ("details"/"terms")
        // must be re-sent here too for the same reason — otherwise editing
        // the welcome message/terms after a customer's first push would
        // never reach their already-installed card.
        textModulesData: [
          { id: "reward", header: fields.secondaryLabel, body: secondaryValue },
          ...(fields.expiry ? [{ id: "expiry", header: fields.expiry.label, body: fields.expiry.value }] : []),
          ...detailTextModules,
        ],
        ...(linksModuleData ? { linksModuleData } : {}),
        // Cache-busted URL (see uploadHeroImage) — Google Wallet and any
        // client-side image cache always fetch the new bytes instead of a
        // stale copy at the same path.
        ...(heroImageUrl ? { heroImage: { sourceUri: { uri: heroImageUrl } } } : {}),
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
                  // Per the official Message reference (developers.google.com/
                  // wallet/reference/rest/v1/Message): messageType defaults to
                  // "TEXT" when omitted — renders on the card's details screen
                  // only, no Android notification. This was the actual bug
                  // behind "the notification shows inside the card but never
                  // outside it": the message itself was correctly delivered,
                  // it was just never told to also notify. TEXT_AND_NOTIFY is
                  // the only value that also fires the lock-screen banner.
                  messageType: "TEXT_AND_NOTIFY",
                },
              ],
              // Per the walletobjects discovery doc's own field description:
              // "This setting is ephemeral and needs to be set with each
              // PATCH or UPDATE request, otherwise a notification will not
              // be triggered." Without this, adding a message only updates
              // in-app data — it never pushes a device notification. Value
              // confirmed against the live API — "NOTIFY" (seen in some doc
              // summaries) is rejected with 400 INVALID_ARGUMENT; the actual
              // enum member is NOTIFY_ON_UPDATE. Kept alongside messageType
              // above — they gate two different notification paths (a
              // loyaltyPoints.balance change vs. a message), and this push
              // always changes both.
              notifyPreference: "NOTIFY_ON_UPDATE",
            }
          : {}),
        },
      }),
    ]);
    return { ok: true, stub: false };
  } catch (err) {
    console.error("[wallet:google] push patch failed", passId, err);
    return { ok: false, stub: false };
  }
}
