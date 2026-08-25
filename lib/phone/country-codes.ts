/**
 * Country dial-code list for the public join page's phone field
 * (app/[locale]/pass/new/page.tsx). Deliberately a plain hardcoded list
 * rather than a library — no phone-number package is a dependency yet (see
 * package.json), and this only needs to produce a correct "+<dial code>"
 * prefix, not full national-format parsing/formatting.
 *
 * Not exhaustive (~70 countries) but covers North America, Europe, the
 * whole GCC/Levant/North Africa region (this product's Arabic-locale
 * market), and the largest Asian/APAC/LatAm markets. `phone` regex
 * validation in lib/validators/index.ts's enrollSchema only checks the
 * combined "+<digits>" shape, so a country missing from this list still
 * works correctly if ever added — this list only drives the picker UI.
 */
export type CountryDialCode = {
  /** ISO 3166-1 alpha-2, uppercase. */
  iso2: string;
  name: string;
  /** No leading "+". */
  dialCode: string;
};

export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { iso2: "AE", name: "United Arab Emirates", dialCode: "971" },
  { iso2: "AR", name: "Argentina", dialCode: "54" },
  { iso2: "AT", name: "Austria", dialCode: "43" },
  { iso2: "AU", name: "Australia", dialCode: "61" },
  { iso2: "BD", name: "Bangladesh", dialCode: "880" },
  { iso2: "BE", name: "Belgium", dialCode: "32" },
  { iso2: "BH", name: "Bahrain", dialCode: "973" },
  { iso2: "BR", name: "Brazil", dialCode: "55" },
  { iso2: "CA", name: "Canada", dialCode: "1" },
  { iso2: "CH", name: "Switzerland", dialCode: "41" },
  { iso2: "CL", name: "Chile", dialCode: "56" },
  { iso2: "CN", name: "China", dialCode: "86" },
  { iso2: "CO", name: "Colombia", dialCode: "57" },
  { iso2: "CZ", name: "Czechia", dialCode: "420" },
  { iso2: "DE", name: "Germany", dialCode: "49" },
  { iso2: "DK", name: "Denmark", dialCode: "45" },
  { iso2: "DZ", name: "Algeria", dialCode: "213" },
  { iso2: "EG", name: "Egypt", dialCode: "20" },
  { iso2: "ES", name: "Spain", dialCode: "34" },
  { iso2: "ET", name: "Ethiopia", dialCode: "251" },
  { iso2: "FI", name: "Finland", dialCode: "358" },
  { iso2: "FR", name: "France", dialCode: "33" },
  { iso2: "GB", name: "United Kingdom", dialCode: "44" },
  { iso2: "GH", name: "Ghana", dialCode: "233" },
  { iso2: "GR", name: "Greece", dialCode: "30" },
  { iso2: "HK", name: "Hong Kong", dialCode: "852" },
  { iso2: "HU", name: "Hungary", dialCode: "36" },
  { iso2: "ID", name: "Indonesia", dialCode: "62" },
  { iso2: "IE", name: "Ireland", dialCode: "353" },
  { iso2: "IL", name: "Israel", dialCode: "972" },
  { iso2: "IN", name: "India", dialCode: "91" },
  { iso2: "IQ", name: "Iraq", dialCode: "964" },
  { iso2: "IT", name: "Italy", dialCode: "39" },
  { iso2: "JO", name: "Jordan", dialCode: "962" },
  { iso2: "JP", name: "Japan", dialCode: "81" },
  { iso2: "KE", name: "Kenya", dialCode: "254" },
  { iso2: "KR", name: "South Korea", dialCode: "82" },
  { iso2: "KW", name: "Kuwait", dialCode: "965" },
  { iso2: "LB", name: "Lebanon", dialCode: "961" },
  { iso2: "LK", name: "Sri Lanka", dialCode: "94" },
  { iso2: "LY", name: "Libya", dialCode: "218" },
  { iso2: "MA", name: "Morocco", dialCode: "212" },
  { iso2: "MX", name: "Mexico", dialCode: "52" },
  { iso2: "MY", name: "Malaysia", dialCode: "60" },
  { iso2: "NG", name: "Nigeria", dialCode: "234" },
  { iso2: "NL", name: "Netherlands", dialCode: "31" },
  { iso2: "NO", name: "Norway", dialCode: "47" },
  { iso2: "NP", name: "Nepal", dialCode: "977" },
  { iso2: "NZ", name: "New Zealand", dialCode: "64" },
  { iso2: "OM", name: "Oman", dialCode: "968" },
  { iso2: "PE", name: "Peru", dialCode: "51" },
  { iso2: "PH", name: "Philippines", dialCode: "63" },
  { iso2: "PK", name: "Pakistan", dialCode: "92" },
  { iso2: "PL", name: "Poland", dialCode: "48" },
  { iso2: "PT", name: "Portugal", dialCode: "351" },
  { iso2: "QA", name: "Qatar", dialCode: "974" },
  { iso2: "RO", name: "Romania", dialCode: "40" },
  { iso2: "RU", name: "Russia", dialCode: "7" },
  { iso2: "SA", name: "Saudi Arabia", dialCode: "966" },
  { iso2: "SD", name: "Sudan", dialCode: "249" },
  { iso2: "SE", name: "Sweden", dialCode: "46" },
  { iso2: "SG", name: "Singapore", dialCode: "65" },
  { iso2: "SY", name: "Syria", dialCode: "963" },
  { iso2: "TH", name: "Thailand", dialCode: "66" },
  { iso2: "TN", name: "Tunisia", dialCode: "216" },
  { iso2: "TR", name: "Turkey", dialCode: "90" },
  { iso2: "TW", name: "Taiwan", dialCode: "886" },
  { iso2: "UA", name: "Ukraine", dialCode: "380" },
  { iso2: "US", name: "United States", dialCode: "1" },
  { iso2: "VE", name: "Venezuela", dialCode: "58" },
  { iso2: "VN", name: "Vietnam", dialCode: "84" },
  { iso2: "YE", name: "Yemen", dialCode: "967" },
  { iso2: "ZA", name: "South Africa", dialCode: "27" },
].sort((a, b) => a.name.localeCompare(b.name));

const BY_ISO2 = new Map(COUNTRY_DIAL_CODES.map((c) => [c.iso2, c]));

export function countryByIso2(iso2: string): CountryDialCode | undefined {
  return BY_ISO2.get(iso2.toUpperCase());
}

/** Regional-indicator flag emoji computed from the ISO2 code — avoids
 * hardcoding ~70 emoji literals (and their source-encoding footguns). */
export function flagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

const DEFAULT_ISO2 = "US";

/** Best-effort client-side guess at the visitor's country, from the
 * browser's negotiated language tags (e.g. "ar-EG", "en-GB" -> region
 * subtag). No geolocation/IP lookup — this only needs to save most people a
 * scroll, not be authoritative; the merchant/customer can always change it.
 * Falls back to DEFAULT_ISO2 when nothing usable is available (SSR, a
 * bare "en" tag with no region, or an unrecognized region). */
export function detectDefaultCountryIso2(): string {
  if (typeof navigator === "undefined") return DEFAULT_ISO2;
  const tags = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
  for (const tag of tags ?? []) {
    const region = tag?.split("-")[1]?.toUpperCase();
    if (region && BY_ISO2.has(region)) return region;
  }
  return DEFAULT_ISO2;
}
