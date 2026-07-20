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
- `webServiceURL` + `authenticationToken`: required for push updates — point at `/api/wallet/apple/webservice/[passId]`.

**Push update flow (critical — this is the "wallet updates instantly" promise):**
1. When a customer adds the pass, their device calls `POST /api/wallet/apple/register` — store the returned push token against `customer_progress.apple_push_token`.
2. When progress changes (after a scan), the server sends an APNs push notification (empty payload, just a wake-up signal) to that device.
3. The device then calls back to `webServiceURL` (`GET .../v1/passes/{passTypeId}/{serialNumber}`) to fetch the updated pass — implement this per Apple's PassKit Web Service spec, returning a fresh signed `.pkpass` if the pass has changed since the client's `If-Modified-Since` header.

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

## Shared Considerations
- Keep a single source of truth for "what should this pass currently display" as a pure function (e.g. `lib/wallet/renderPassFields(programType, config, progress)`) used by both the Apple pass generator and the Google object payload builder, so the two platforms never visually drift apart.
- Test on real devices early — wallet pass rendering and push updates are hard to fully verify in a simulator.
- Log every wallet generation/update call (success/failure) — these integrations are the most likely source of silent bugs (e.g. an expired certificate) and need visibility.

## Open Questions for Ahmed
1. Do you already have an Apple Developer account and Pass Type ID set up, or does the agent need to stub this out and wait for credentials?
2. Same question for the Google Cloud Wallet API project/issuer ID.
3. Should the reward-unlocked state change the pass's visual style (e.g. highlight color) to make it obviously different from in-progress state?
