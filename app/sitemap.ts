import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";

// Public marketing routes only — dashboard/auth/pass routes are per-account
// or per-customer and excluded via robots.ts instead.
const ROUTES = [
  "",
  "about",
  "faq",
  "features",
  "features/analytics",
  "features/programs",
  "features/updates",
  "features/wallet",
  "industries",
  "infrastructure",
  "pricing",
  "support",
  "privacy",
  "terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://walletos.online";
  const lastModified = new Date();

  return ROUTES.flatMap((route) =>
    locales.map((locale) => ({
      url: `${appUrl}/${locale}${route ? `/${route}` : ""}`,
      lastModified,
    }))
  );
}
