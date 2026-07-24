import { locales } from "@/i18n/config";

/** Swap the locale segment of a pathname, e.g. /en/dashboard/billing -> /ar/dashboard/billing. */
export function switchLocaleHref(pathname: string, nextLocale: string, currentLocale: string) {
  const segments = pathname.split("/");
  if (segments[1] === currentLocale) {
    segments[1] = nextLocale;
    return segments.join("/") || `/${nextLocale}`;
  }
  return `/${nextLocale}`;
}

/** Endonym for a locale code (e.g. "ar" -> "العربية"), so new locales never need a hardcoded label. */
export function localeLabel(code: string) {
  try {
    const name = new Intl.DisplayNames([code], { type: "language" }).of(code);
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

export { locales };
