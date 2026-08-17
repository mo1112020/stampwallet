/**
 * Apple's official strip image spec for storeCard/coupon passes (Apple
 * Human Interface Guidelines > Wallet > Pass images > Strip image,
 * "Specifications added January 17, 2025"): 375x144pt @1x. This used to be
 * hardcoded as 375x123 in lib/wallet/heroImage.ts, going by the older,
 * commonly-cited-but-unofficial figure that predates Apple publishing exact
 * dimensions — real generated passes were rendering a noticeably shorter
 * strip than Apple actually allocates, and the dashboard's phone-mockup
 * preview (components/dashboard/phone-mockup.tsx) copied that same wrong
 * number.
 *
 * Pulled into its own file (no Node-only dependencies) so it can be
 * imported both by heroImage.ts (server, uses sharp/resvg) and by the
 * client-side phone-mockup component — importing heroImage.ts directly from
 * a "use client" component would try to bundle those native/server-only
 * packages into the browser build.
 */
export const STRIP_WIDTH_1X = 375;
export const STRIP_HEIGHT_1X = 144;
