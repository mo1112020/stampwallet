import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import createNextIntlPlugin from "next-intl/plugin";
import createMDX from "@next/mdx";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");
// mdxType: "gfm" turns on GitHub-flavored markdown parsing (tables, strikethrough,
// task lists, autolinks) in the Rust mdx compiler — off by default, which silently
// left a markdown table in blog content rendering as a plain paragraph instead of
// an actual <table>. See node_modules/@next/mdx/mdx-rs-loader.js for the option map.
const withMDX = createMDX({ options: { mdxType: "gfm" } });
const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Blog posts (content/blog/{locale}/{slug}.mdx, dynamically imported by
  // app/[locale]/(marketing)/blog/[slug]/page.tsx) are the only current MDX
  // use — mdxRs is the documented way to get @next/mdx working under
  // Turbopack (this project's dev/build compiler; see the turbopack block
  // below), since the default webpack-loader path doesn't apply there.
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  // "standalone" powers the self-host Dockerfile (it produces a minimal server.js
  // bundle), but Vercel's own builder does its own file tracing/packaging and expects
  // the default output shape — with "standalone" set, it looks for
  // .next/next-server.js.nft.json in a location standalone mode doesn't produce it,
  // and the build fails with ENOENT. Rather than trying to detect Vercel (its System
  // Environment Variables aren't reliably exposed to every project's build step), the
  // Dockerfile explicitly opts in via STANDALONE_BUILD=1; everyone else — including
  // Vercel — gets the safe default.
  ...(process.env.STANDALONE_BUILD ? { output: "standalone" } : {}),
  // @resvg/resvg-js loads a native .node addon through a pattern Turbopack's
  // bundler can't place a module id for ("non-ecmascript placeable asset"),
  // failing the whole build — sharp doesn't need this (Next already
  // special-cases it), but resvg-js does. This tells Next to leave it as a
  // plain runtime require instead of trying to bundle it.
  serverExternalPackages: ["@resvg/resvg-js"],
  images: {
    remotePatterns: [
      // Historical uploads (before the /storage rewrite below existed)
      // still point at the raw Supabase URL and keep working — new
      // uploads get an app-domain URL instead, see lib/supabase/publicAssetUrl.ts.
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "walletos.online" },
      { protocol: "https", hostname: "www.walletos.online" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // Proxies uploaded/generated images (program logos, cover photos, Google
  // Wallet hero images) through this app's own domain instead of exposing
  // the Supabase project's raw hostname — see lib/supabase/publicAssetUrl.ts,
  // which builds the matching walletos.online URL for anything uploaded
  // through app/api/upload or lib/wallet/heroImage.ts's uploadHeroImage().
  // The path shape (`/storage/v1/object/public/<bucket>/<file>`) is exactly
  // what Supabase's own getPublicUrl() returns, so this is a 1:1 passthrough.
  async rewrites() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
    return [
      {
        source: "/storage/:path*",
        destination: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/:path*`,
      },
    ];
  },
  // Baseline security headers flagged missing by a Lighthouse audit. A
  // Content-Security-Policy is deliberately NOT included here — Google Tag
  // Manager injects scripts from arbitrary origins at runtime, so a CSP
  // strict enough to matter would need per-request nonces threaded through
  // every inline script (the consent-default Script in app/layout.tsx
  // included) and needs its own dedicated pass, not a drive-by addition.
  // HSTS preload is also omitted — it's a one-way door (browsers refuse
  // plain HTTP for this domain and its subdomains essentially permanently
  // once submitted to the preload list), so that's a decision for the site
  // owner to opt into explicitly, not something to enable silently here.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // camera=(self) — the staff Scanner PWA (app/[locale]/scan-app) uses
          // getUserMedia for QR/barcode scanning; everything else stays denied.
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(), payment=()",
          },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
  // Without this, Turbopack walks up looking for a lockfile and can land on an unrelated
  // one outside this repo (e.g. a parent folder's package-lock.json), which then silently
  // scopes module resolution/watching to the wrong directory tree. Pinning it to this
  // project's own folder makes root inference deterministic in any environment.
  turbopack: {
    root: projectRoot,
  },
  // Next.js blocks cross-origin dev-server requests by default (localhost only). Without
  // this, opening the site from a phone on the same network via LAN IP (e.g. 192.168.x.x)
  // gets its JS/CSS requests silently rejected — the page loads but hydration never runs,
  // which looks like "broken navbar, text missing, nothing clickable." Dev-only; no effect
  // on production builds.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  experimental: {
    // Every dashboard page is fully dynamic (per-request auth + DB reads), so
    // Next's default `dynamic: 0` means the Client Router Cache never reuses
    // a page segment — clicking back to a page you just left re-runs the
    // full server round trip every time. 30s lets that back-and-forth
    // navigation feel instant from cache. Mutations still see fresh data
    // immediately: every write flow in this app calls `router.refresh()`,
    // which explicitly bypasses this cache for the current route. The only
    // tradeoff is a page you're not currently viewing can show data that's
    // up to 30s stale if it changed via a different tab/page in that window.
    staleTimes: {
      dynamic: 30,
    },
    // The documented way to get @next/mdx working under Turbopack — see the
    // pageExtensions comment above.
    mdxRs: true,
  },
};

export default withSentryConfig(withNextIntl(withMDX(nextConfig)), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Source map upload -- inert until SENTRY_AUTH_TOKEN/SENTRY_ORG/
  // SENTRY_PROJECT are set (build-time secret, deliberately deferred until
  // basic error capture is confirmed working; see instrumentation-client.ts).
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Suppress non-CI output -- keeps local `next build` logs from being
  // dominated by Sentry's own upload chatter.
  silent: !process.env.CI,

  // Turbopack is this project's build tool (see the turbopack block above);
  // webpack.treeshake.* options only work under webpack and would silently
  // no-op (or per Sentry's own docs, can break the build) here -- omitted.
});
