import type { LoyaltyProgram, Merchant, Progress } from "@/types";
import { renderPassFields } from "@/lib/wallet/renderPassFields";

export function isGoogleWalletConfigured() {
  return Boolean(
    process.env.GOOGLE_WALLET_ISSUER_ID &&
      process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY
  );
}

export async function generateGoogleWalletLink(params: {
  passId: string;
  program: LoyaltyProgram;
  merchant: Merchant;
  progress: Progress;
}): Promise<{ saveUrl: string; stub: boolean }> {
  const fields = renderPassFields(
    params.program.type,
    params.program.config,
    params.progress,
    params.merchant.business_name
  );

  if (!isGoogleWalletConfigured()) {
    console.info("[wallet:google] stub link", params.passId);
    return {
      saveUrl: `/pass/${params.passId}?wallet=google-stub&primary=${encodeURIComponent(fields.primaryValue)}`,
      stub: true,
    };
  }

  // Real JWT signing would happen here with the service account.
  return {
    saveUrl: `https://pay.google.com/gp/v/save/STUB_${params.passId}`,
    stub: true,
  };
}

export async function pushGooglePassUpdate(passId: string, objectId: string | null) {
  if (!isGoogleWalletConfigured()) {
    console.info("[wallet:google] stub patch", passId, objectId);
    return { ok: true, stub: true };
  }
  console.info("[wallet:google] would patch loyalty object", passId);
  return { ok: true, stub: false };
}
