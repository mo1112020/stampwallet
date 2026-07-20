import { pushApplePassUpdate } from "@/lib/wallet/apple";
import { pushGooglePassUpdate } from "@/lib/wallet/google";

export async function pushWalletUpdate(params: {
  passId: string;
  applePushToken: string | null;
  googleObjectId: string | null;
}) {
  await Promise.all([
    pushApplePassUpdate(params.passId, params.applePushToken),
    pushGooglePassUpdate(params.passId, params.googleObjectId),
  ]);
}
