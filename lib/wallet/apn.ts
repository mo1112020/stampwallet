import http2 from "node:http2";
import { loadAppleCertificates } from "@/lib/wallet/appleCerts";

// Pass Type ID push certificates only ever talk to the production APNs
// gateway — there is no sandbox distinction for Wallet pass updates.
const APNS_HOST = "https://api.push.apple.com";

export type ApplePushResult = {
  ok: boolean;
  status?: number;
  error?: string;
  /** APNs' machine-readable failure reason, parsed from the JSON error body
   * (e.g. { "reason": "BadDeviceToken" }) per Apple's documented error
   * responses (developer.apple.com/documentation/usernotifications/handling-notification-responses-from-apns).
   * Undefined on success, on a transport-level failure with no HTTP
   * response at all (timeout, TLS/connection error), or if the body isn't
   * the expected JSON shape — callers must not assume a permanent failure
   * just because this is unset. */
  reason?: string;
};

export async function sendApplePush(
  pushToken: string,
  topic: string
): Promise<ApplePushResult> {
  let certs;
  try {
    certs = loadAppleCertificates();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "certs unavailable" };
  }

  return new Promise((resolve) => {
    let settled = false;
    const settle = (result: ApplePushResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      client.close();
      resolve(result);
    };

    const client = http2.connect(APNS_HOST, {
      // `cert` is OUR client certificate chain for mutual TLS: the leaf pass
      // cert followed by its issuing intermediate (WWDR) so Apple's push
      // server can build the chain up to its own already-trusted root.
      // `ca` (deliberately omitted) is for validating APPLE's server
      // certificate instead — it is a completely different PKI branch than
      // WWDR (which only signs pass/code-signing certs), so setting it to
      // WWDR replaced Node's trusted root store and made every connection
      // fail with "unable to get local issuer certificate".
      cert: certs.signerCert + certs.wwdr,
      key: certs.signerKeyPem,
    });

    // Neither an unreachable APNs host nor a stalled TLS handshake is
    // guaranteed to ever fire the client's "error" event, so without this
    // the returned promise can hang forever — this call sits inside every
    // wallet push (lib/wallet/push.ts), and a sequential notification-send
    // loop (campaigns.ts) awaits each push in turn, so one hung connection
    // here previously wedged an entire campaign at "sending" indefinitely.
    const timeout = setTimeout(() => settle({ ok: false, error: "APNs request timed out" }), 8000);

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
      if (status === 200) {
        settle({ ok: true, status });
        return;
      }
      // Apple's failure body is JSON: { "reason": "BadDeviceToken" } (or
      // "Unregistered" alongside a 410, among others) — malformed/empty
      // bodies (a proxy error page, a truncated response) just leave
      // `reason` unset rather than throwing, so callers still get the raw
      // status/body for logging.
      let reason: string | undefined;
      try {
        const parsed = JSON.parse(body) as { reason?: string };
        reason = parsed.reason;
      } catch {
        // Not JSON — leave reason unset.
      }
      settle({ ok: false, status, error: body, reason });
    });
    req.on("error", (err) => settle({ ok: false, error: err.message }));

    req.end(JSON.stringify({}));
  });
}
