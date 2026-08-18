import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <div className="ws-stamp">
      <MarketingHeader locale={locale} />
      {children}
      <MarketingFooter locale={locale} />
    </div>
  );
}
