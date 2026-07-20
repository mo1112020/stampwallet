import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function MarketingFooter({ locale }: { locale: string }) {
  const t = await getTranslations("site.footer");
  const nav = await getTranslations("site.nav");

  return (
    <footer className="border-t border-[var(--line)] bg-white text-[var(--ink)]">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-4">
        <div>
          <p className="font-brand text-lg">StampWallet</p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{t("tagline")}</p>
        </div>
        <div>
          <p className="text-[12px] font-semibold text-[var(--ink)]">{t("product")}</p>
          <ul className="mt-4 space-y-2.5 text-sm text-[var(--muted)]">
            <li>
              <Link href={`/${locale}/features`} className="hover:text-[var(--ink)]">
                {nav("features")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/infrastructure`} className="hover:text-[var(--ink)]">
                {nav("infrastructure")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/pricing`} className="hover:text-[var(--ink)]">
                {nav("pricing")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[12px] font-semibold text-[var(--ink)]">{t("company")}</p>
          <ul className="mt-4 space-y-2.5 text-sm text-[var(--muted)]">
            <li>
              <Link href={`/${locale}/about`} className="hover:text-[var(--ink)]">
                {nav("about")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/industries`} className="hover:text-[var(--ink)]">
                {nav("industries")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/faq`} className="hover:text-[var(--ink)]">
                {nav("faq")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/signup`} className="hover:text-[var(--ink)]">
                {t("start")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[12px] font-semibold text-[var(--ink)]">{t("legal")}</p>
          <ul className="mt-4 space-y-2.5 text-sm text-[var(--muted)]">
            <li>{t("privacy")}</li>
            <li>{t("terms")}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--line)] px-6 py-5 text-center text-xs text-[var(--muted)]">
        {t("copyright")}
      </div>
    </footer>
  );
}
