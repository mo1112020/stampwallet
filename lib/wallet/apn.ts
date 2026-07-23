import http2 from "node:http2";
import { loadAppleCertificates } from "@/lib/wallet/appleCerts";

// Pass Type ID push certificates only ever talk to the production APNs
// gateway — there is no sandbox distinction for Wallet pass updates.
const APNS_HOST = "https://api.push.apple.com";

export async function sendApplePush(
  pushToken: string,
  topic: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  let certs;
  try {
    certs = loadAppleCertificates();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "certs unavailable" };
  }

  return new Promise((resolve) => {
    let settled = false;
    const settle = (result: { ok: boolean; status?: number; error?: string }) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const client = http2.connect(APNS_HOST, {
      cert: certs.signerCert,
      key: certs.signerKeyPem,
      ca: certs.wwdr,
    });

    client.on("error", (err) => settle({ ok: false, error: err.message }));

    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${pushToken}`,
      "apns-topic": topic,
      "apns-push-type": "background",
      "apns-priority": "5",
      "content-type": "application/json",
    });

    let status = 0;
    let body = "";

    req.on("response", (headers) => {
      status = Number(headers[":status"] ?? 0);
    });
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      client.close();
      settle({ ok: status === 200, status, error: status !== 200 ? body : undefined });
    });
    req.on("error", (err) => settle({ ok: false, error: err.message }));

    req.end(JSON.stringify({}));
  });
}
