import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");
const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
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
};

export default withNextIntl(nextConfig);
