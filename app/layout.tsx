import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StampWallet",
  description: "Loyalty cards customers actually use — in Apple and Google Wallet.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
