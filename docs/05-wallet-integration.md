# Wallet Integration (Apple Wallet + Google Wallet)

This is the trickiest technical piece of StampWallet — budget extra time/testing here.

## Apple Wallet (PassKit)

**Prerequisites (Ahmed needs to provide/set up, agent should not fabricate):**
- Apple Developer account
- Pass Type ID certificate (`.p12`) + password
- Apple WWDR intermediate certificate
- A registered Pass Type Identifier (e.g. `pass.com.stampwallet.loyalty`)

**Pass structure**: a `.pkpass` is a signed zip containing `pass.json`, icons/images, and a manifest. Use a library (e.g. `passkit-generator` for Node) rather than hand-rolling the zip/signing — flag to Ahmed if the chosen library needs a newer Node runtime than Vercel's default.

**`pass.json` key fields for each program type:**
- Use the `storeCard` pass style for all three types (fits stamp/points/steps best).
- `storeCard.primaryFields`: current progress (e.g. "4 / 10 stamps", "560 / 1000 pts", current stage name).
- `storeCard.secondaryFields`: reward description.
- `storeCard.auxiliaryFields`: business name / next milestone.
- `barcodes`: QR code encoding the `pass_id`.
- `webServiceURL` + `authenticationToken`: required for push updates — `webServiceURL` is `${NEXT_PUBLIC_APP_URL}/api/wallet/apple`, Apple appends `v1/...` to it itself per the PassKit Web Service spec.
- `locations` (Phase 9, optional): merchant store coordinates, embedded when any exist — see "Location-based relevance" below.

**Status: implemented**, not just planned — `lib/wallet/apple.ts` (pass generation via `passkit-generator`), `lib/wallet/apn.ts` (APNs push), and the full PassKit Web Service protocol under `app/api/wallet/apple/v1/` (device registration, unregistration, updated-serials polling, pass fetch, device logs). Gated behind `isAppleWalletConfigured()` — without real certs it falls back to a JSON stub rather than failing, so local dev works without Ahmed's credentials.

**Push update flow (critical — this is the "wallet updates instantly" promise):**
1. When a customer adds the pass, their device calls `POST {webServiceURL}/v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}` — the push token is stored in `apple_device_registrations`, not a column on `customer_progress` (a pass can be added on multiple devices).
2. When progress changes (after a scan) or a notification is sent, the server sends an APNs push notification (empty payload, just a wake-up signal) to every registered device for that pass.
3. The device then calls back to `webServiceURL` (`GET {webServiceURL}/v1/passes/{passTypeId}/{serialNumber}`) to fetch the updated pass — implemented per Apple's PassKit Web Service spec, returning a fresh signed `.pkpass` if the pass has changed since the client's `If-Modified-Since` header.

Do not skip step 2/3 to "save time" — without real push updates the core value prop (pass updates instantly after a scan) doesn't work and the customer has to manually refresh, which defeats the product.

## Google Wallet

**Prerequisites (Ahmed needs to provide):**
- Google Cloud project with Wallet API enabled
- Issuer ID
- Service account with Wallet Object permissions

**Flow:**
1. Define a **Loyalty Class** per loyalty program (one class per program, not per customer) — holds shared branding/config.
2. Define a **Loyalty Object** per customer enrollment — holds that customer's live progress. Object ID should map to `pass_id`.
3. Generate an "Add to Google Wallet" link/button using a signed JWT referencing the class+object.
4. To update: call the Wallet API's `loyaltyobject.patch` (or `.update`) endpoint directly with new field values — Google Wallet passes update automatically on the user's device once the object is patched server-side; there's no separate push-registration handshake like Apple's.

**Status: implemented** — `lib/wallet/google.ts` (class/object upsert, save-link JWT signing, patch-based push) and `lib/wallet/googleAuth.ts` (service account OAuth). Same `isGoogleWalletConfigured()` graceful-stub gating as Apple.

## Notifications ride on this pipeline (Phase 8)
Per product direction, StampWallet has no email/SMS/separate customer app — notification campaigns and automated triggers (reward unlocked, birthday, expiring reward, inactive customer) are delivered by writing the message to `customer_progress.latest_notification_message` and pushing a wallet update carrying it (`lib/wallet/push.ts`'s `pushWalletUpdate` now takes an optional `notification` param). Apple shows it via a back-of-card field with `changeMessage: "%@"`; Google appends it to the loyalty object's `messages` array. See `lib/notifications/*` and `02-database-schema.md`'s `notification_campaigns`/`notification_sends` tables. This inherits the exact same stub-without-credentials behavior as everything else here.

## Location-based relevance (Phase 9)
No separate geofencing service, no customer app, no location permission prompt beyond what Wallet itself requires. Both PassKit (`locations` field, an array of `{latitude, longitude, relevantText?}`) and Google Wallet (`locations` on the loyalty object) natively show the pass on the lock screen when the device is physically near the embedded coordinates — this is entirely OS-level. `lib/wallet/locations.ts`'s `getActiveStoreLocations()` reads the merchant's `store_locations` rows and is called from inside the pass-generation/push functions, so any merchant with at least one active location gets this automatically, no extra wiring per pass.

## Shared Considerations
- Keep a single source of truth for "what should this pass currently display" as a pure function (e.g. `lib/wallet/renderPassFields(programType, config, progress)`) used by both the Apple pass generator and the Google object payload builder, so the two platforms never visually drift apart.
- Test on real devices early — wallet pass rendering and push updates are hard to fully verify in a simulator.
- Log every wallet generation/update call (success/failure) — these integrations are the most likely source of silent bugs (e.g. an expired certificate) and need visibility.

## Open Questions for Ahmed
1. Do you already have an Apple Developer account and Pass Type ID set up, or does the agent need to stub this out and wait for credentials?
2. Same question for the Google Cloud Wallet API project/issuer ID.
3. ~~Should the reward-unlocked state change the pass's visual style~~ — resolved: the secondary field is prefixed with 🎁 and "Ready to redeem!" when a reward is available (`lib/wallet/renderPassFields.ts`'s `rewardAvailable`, consumed identically by both `apple.ts` and `google.ts`), rather than changing background/label colors — keeps the pass's brand colors consistent while still being visually distinct. Revisit if real device testing shows this isn't prominent enough.
