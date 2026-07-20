import type { LoyaltyProgram, Merchant, Progress } from "@/types";
import { renderPassFields } from "@/lib/wallet/renderPassFields";

export function isAppleWalletConfigured() {
  return Boolean(
    process.env.APPLE_PASS_TYPE_IDENTIFIER &&
      process.env.APPLE_TEAM_IDENTIFIER &&
      process.env.APPLE_PASS_CERTIFICATE &&
      process.env.APPLE_WWDR_CERTIFICATE
  );
}

export async function generateApplePass(params: {
  passId: string;
  program: LoyaltyProgram;
  merchant: Merchant;
  progress: Progress;
}): Promise<{ buffer: Buffer; contentType: string; stub: boolean }> {
  const fields = renderPassFields(
    params.program.type,
    params.program.config,
    params.progress,
    params.merchant.business_name
  );

  if (!isAppleWalletConfigured()) {
    const stub = Buffer.from(
      JSON.stringify(
        {
          stub: true,
          format: "pkpass-stub",
          passId: params.passId,
          fields,
          message:
            "Apple Wallet certificates not configured. Add env vars to generate real .pkpass files.",
        },
        null,
        2
      )
    );
    console.info("[wallet:apple] stub generate", params.passId);
    return { buffer: stub, contentType: "application/json", stub: true };
  }

  // Real PassKit generation would use passkit-generator here with env certificates.
  const stub = Buffer.from(
    JSON.stringify({
      stub: false,
      message: "Certificate present but passkit-generator wiring pending device certs test",
      passId: params.passId,
      fields,
    })
  );
  return { buffer: stub, contentType: "application/json", stub: true };
}

export async function pushApplePassUpdate(passId: string, pushToken: string | null) {
  if (!pushToken) {
    console.info("[wallet:apple] no push token for", passId);
    return { ok: true, stub: true };
  }
  if (!isAppleWalletConfigured()) {
    console.info("[wallet:apple] stub push update", passId);
    return { ok: true, stub: true };
  }
  console.info("[wallet:apple] would send APNs wake for", passId);
  return { ok: true, stub: false };
}
