import { Resend } from "resend";

export function createResendClient(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(key);
}

export function createResendClientSafe(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return createResendClient();
}

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function emailFrom(): string {
  const address = process.env.RESEND_FROM_EMAIL;
  const name = process.env.RESEND_FROM_NAME || "WalletOS";
  if (!address) {
    throw new Error("RESEND_FROM_EMAIL is not configured");
  }
  return `${name} <${address}>`;
}
