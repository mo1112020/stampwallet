/**
 * Supabase Storage's own getPublicUrl() returns a raw `<project-ref>.supabase.co`
 * URL. Rewriting it onto this app's own domain keeps uploaded/generated
 * images (program logos, cover photos, Google Wallet hero images) served
 * from walletos.online instead of exposing the Supabase project's hostname.
 *
 * This pairs with the `/storage/:path*` rewrite in next.config.mjs, which
 * proxies those same paths back to Supabase Storage transparently — so the
 * file itself doesn't move, only the URL merchants/customers/Google ever see.
 *
 * NEXT_PUBLIC_APP_URL is already this codebase's established "this
 * deployment's own public URL" convention (see .env.example — it's baked
 * into Apple's webServiceURL and Google Wallet asset URLs), so this keeps
 * the same per-environment behavior: production gets walletos.online,
 * other environments get wherever they're actually running.
 */
export function toAppDomainStorageUrl(supabasePublicUrl: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const marker = "/storage/";
  const idx = supabasePublicUrl.indexOf(marker);
  if (idx === -1) return supabasePublicUrl;
  return `${appUrl}${supabasePublicUrl.slice(idx)}`;
}
