import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://walletos.online";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Dashboard/auth/API/customer-pass routes are per-account or
        // per-customer, dynamic, and not meant to be indexed.
        disallow: ["/api/", "/dashboard/", "/scan-app/", "/auth/", "/pass/"],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
