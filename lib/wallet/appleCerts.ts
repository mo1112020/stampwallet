import forge from "node-forge";

export type ApplePemCertificates = {
  wwdr: string;
  signerCert: string;
  signerKeyPem: string;
};

let cached: ApplePemCertificates | null = null;

function looksLikePem(text: string) {
  return text.trimStart().startsWith("-----BEGIN");
}

function toPem(label: string, der: Buffer) {
  const lines = der.toString("base64").match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----\n`;
}

/**
 * Accepts either raw PEM text or base64 in the env var so Ahmed can paste
 * whichever format his cert is already in (e.g. `base64 -w0 wwdr.pem`).
 */
function normalizeToPem(raw: string, label: string) {
  if (looksLikePem(raw)) return raw;
  const decoded = Buffer.from(raw, "base64");
  const decodedText = decoded.toString("utf8");
  if (looksLikePem(decodedText)) return decodedText;
  return toPem(label, decoded);
}

/**
 * APPLE_PASS_CERTIFICATE is the base64 of the Pass Type ID .p12 export from
 * Keychain Access (or `openssl pkcs12 -export`). Extracts the signing cert
 * + private key as PEM using the .p12 password.
 */
export function loadAppleCertificates(): ApplePemCertificates {
  if (cached) return cached;

  const p12Base64 = process.env.APPLE_PASS_CERTIFICATE;
  const p12Password = process.env.APPLE_PASS_CERTIFICATE_PASSWORD ?? "";
  const wwdrRaw = process.env.APPLE_WWDR_CERTIFICATE;

  if (!p12Base64 || !wwdrRaw) {
    throw new Error("Apple Wallet certificates are not configured");
  }

  const p12Binary = Buffer.from(p12Base64, "base64").toString("binary");
  const p12Asn1 = forge.asn1.fromDer(p12Binary);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, p12Password);

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag] ?? [];
  const shroudedKeyBags =
    p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag] ?? [];
  const keyBags = p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag] ?? [];

  const certBag = certBags[0];
  const keyBag = shroudedKeyBags[0] ?? keyBags[0];

  if (!certBag?.cert || !keyBag?.key) {
    throw new Error(
      "Could not find a certificate + private key pair inside APPLE_PASS_CERTIFICATE — " +
        "check the .p12 export includes both and APPLE_PASS_CERTIFICATE_PASSWORD is correct"
    );
  }

  const signerCert = forge.pki.certificateToPem(certBag.cert);
  const signerKeyPem = forge.pki.privateKeyToPem(keyBag.key);
  const wwdr = normalizeToPem(wwdrRaw, "CERTIFICATE");

  cached = { wwdr, signerCert, signerKeyPem };
  return cached;
}
