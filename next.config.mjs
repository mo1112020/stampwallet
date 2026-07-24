import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // Next.js blocks cross-origin dev-server requests by default (localhost only). Without
  // this, opening the site from a phone on the same network via LAN IP (e.g. 192.168.x.x)
  // gets its JS/CSS requests silently rejected — the page loads but hydration never runs,
  // which looks like "broken navbar, text missing, nothing clickable." Dev-only; no effect
  // on production builds.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
};

export default withNextIntl(nextConfig);
