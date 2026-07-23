import { JWT } from "google-auth-library";

export type GoogleServiceAccount = {
  client_email: string;
  private_key: string;
};

let cachedCreds: GoogleServiceAccount | null = null;
let cachedClient: JWT | null = null;

/**
 * GOOGLE_WALLET_SERVICE_ACCOUNT_KEY can be either the raw JSON of the
 * downloaded service account key file, or that JSON base64-encoded
 * (handy when the hosting platform's env var UI mangles newlines/quotes).
 */
function parseServiceAccountKey(): GoogleServiceAccount {
  if (cachedCreds) return cachedCreds;
  const raw = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("GOOGLE_WALLET_SERVICE_ACCOUNT_KEY is not set");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    try {
      parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    } catch {
      throw new Error(
        "GOOGLE_WALLET_SERVICE_ACCOUNT_KEY must be the service account JSON key, raw or base64-encoded"
      );
    }
  }

  const creds = parsed as Partial<GoogleServiceAccount>;
  if (!creds.client_email || !creds.private_key) {
    throw new Error("GOOGLE_WALLET_SERVICE_ACCOUNT_KEY is missing client_email or private_key");
  }

  cachedCreds = { client_email: creds.client_email, private_key: creds.private_key };
  return cachedCreds;
}

export function getServiceAccount(): GoogleServiceAccount {
  return parseServiceAccountKey();
}

export function getWalletClient(): JWT {
  if (cachedClient) return cachedClient;
  const creds = parseServiceAccountKey();
  cachedClient = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
  });
  return cachedClient;
}
