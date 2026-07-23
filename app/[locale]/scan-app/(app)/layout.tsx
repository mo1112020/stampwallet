import { redirect } from "next/navigation";
import { getSessionOrNull } from "@/lib/api";
import { ScanAppHeader } from "@/components/scanner/scan-app-header";

export default async function ScanAppAuthedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSessionOrNull();

  if (!session) {
    redirect(`/${locale}/scan-app/login`);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-4 py-6">
      <ScanAppHeader
        locale={locale}
        businessName={session.merchant.business_name}
        role={session.role}
      />
      <div className="mt-6 flex-1">{children}</div>
    </div>
  );
}
