import { createHmac, timingSafeEqual } from "crypto";

function hmac(visitorId: string): string {
  return createHmac("sha256", process.env.UNSUBSCRIBE_SECRET!)
    .update(visitorId)
    .digest("hex");
}

export function signUnsubscribeToken(visitorId: string): string {
  return hmac(visitorId);
}

export function verifyUnsubscribeToken(
  visitorId: string,
  signature: string,
): boolean {
  const expected = Buffer.from(hmac(visitorId), "hex");
  let provided: Buffer;
  try {
    provided = Buffer.from(signature, "hex");
  } catch {
    return false;
  }
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(expected, provided);
}

export function buildUnsubscribeUrl(visitorId: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${appUrl}/api/email/unsubscribe?v=${visitorId}&sig=${signUnsubscribeToken(visitorId)}`;
}
