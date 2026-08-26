import type { ComponentType } from "react";

/**
 * Explicit map of literal dynamic imports, one per published post. Each
 * entry's import() specifier is a fixed string literal — deliberately NOT a
 * template-literal path built from `${locale}/${slug}` at runtime, which
 * webpack/Turbopack "context module" resolution can be finicky about for a
 * two-variable-segment path (locale AND slug both runtime-computed). A
 * literal import() per post is unambiguously supported by both bundlers, at
 * the cost of one extra line here per new post alongside its manifest.ts entry.
 */
const POST_LOADERS: Record<string, () => Promise<{ default: ComponentType }>> = {
  "en:digital-loyalty-cards-guide": () => import("./en/digital-loyalty-cards-guide.mdx"),
};

export function loadPostBody(locale: string, slug: string) {
  return POST_LOADERS[`${locale}:${slug}`]?.();
}
