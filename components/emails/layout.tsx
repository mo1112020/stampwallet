import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

/** Brand values hardcoded rather than pulled from app/globals.css's CSS
 * custom properties — email clients strip/ignore var() almost universally,
 * so every email template needs literal colors matching the light theme. */
export const emailBrand = {
  primary: "#1f57e7",
  primarySoft: "#e8efff",
  ink: "#1c1c1c",
  muted: "#6b7280",
  line: "#e5e7eb",
  surface: "#ffffff",
  background: "#f6f6f6",
  danger: "#dc2626",
};

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/** Always the real public domain, never NEXT_PUBLIC_APP_URL — unlike CTA
 * links (which should point at localhost in dev so you can click through),
 * the logo is fetched by the recipient's email client over the public
 * internet, so a localhost/preview URL just renders as a broken image. */
const EMAIL_LOGO_URL = "https://www.walletos.online/brand/logo-horizontal-light.png";

export function EmailLayout({
  previewText,
  children,
}: {
  previewText: string;
  children: React.ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: emailBrand.background, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: "480px", margin: "0 auto", padding: "32px 16px" }}>
          <Section style={{ textAlign: "center", marginBottom: "24px" }}>
            <Img src={EMAIL_LOGO_URL} alt="WalletOS" height="28" style={{ margin: "0 auto" }} />
          </Section>
          <Section
            style={{
              backgroundColor: emailBrand.surface,
              borderRadius: "20px",
              border: `1px solid ${emailBrand.line}`,
              padding: "32px",
            }}
          >
            {children}
          </Section>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}

export function EmailGreeting({ name }: { name?: string | null }) {
  return (
    <Text style={{ fontSize: "14px", color: emailBrand.muted, margin: "0 0 4px" }}>
      {name ? `Hi ${name},` : "Hi there,"}
    </Text>
  );
}

export function EmailHeading({ children }: { children: React.ReactNode }) {
  return (
    <Heading style={{ fontSize: "22px", fontWeight: 700, color: emailBrand.ink, margin: "0 0 16px", lineHeight: 1.3 }}>
      {children}
    </Heading>
  );
}

export function EmailText({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <Text style={{ fontSize: "15px", lineHeight: "24px", color: muted ? emailBrand.muted : emailBrand.ink, margin: "0 0 16px" }}>
      {children}
    </Text>
  );
}

export function EmailCta({ href, label }: { href: string; label: string }) {
  return (
    <Section style={{ textAlign: "center", margin: "24px 0" }}>
      <Button
        href={href}
        style={{
          backgroundColor: emailBrand.primary,
          color: "#ffffff",
          fontSize: "15px",
          fontWeight: 600,
          borderRadius: "9999px",
          padding: "12px 28px",
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        {label}
      </Button>
    </Section>
  );
}

export function EmailDivider() {
  return <Hr style={{ borderColor: emailBrand.line, margin: "24px 0" }} />;
}

function EmailFooter() {
  return (
    <Section style={{ textAlign: "center", marginTop: "24px" }}>
      <Text style={{ fontSize: "12px", color: emailBrand.muted, margin: "0 0 4px" }}>
        WalletOS — Customer retention that lives in the wallet.
      </Text>
      <Text style={{ fontSize: "12px", color: emailBrand.muted, margin: 0 }}>
        <Link href={appUrl()} style={{ color: emailBrand.muted, textDecoration: "underline" }}>
          walletos.online
        </Link>
      </Text>
    </Section>
  );
}

/** Appended only to marketing/product-update emails (never transactional —
 * verification, invites, and billing receipts must not carry an
 * unsubscribe link that could be mistaken for optional). */
export function EmailUnsubscribeFooter({ manageUrl }: { manageUrl: string }) {
  return (
    <Section style={{ textAlign: "center", marginTop: "12px" }}>
      <Text style={{ fontSize: "11px", color: emailBrand.muted, margin: 0 }}>
        You're receiving this because you have a WalletOS account.{" "}
        <Link href={manageUrl} style={{ color: emailBrand.muted, textDecoration: "underline" }}>
          Manage email preferences
        </Link>
      </Text>
    </Section>
  );
}
