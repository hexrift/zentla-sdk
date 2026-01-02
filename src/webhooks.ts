import { createHmac, timingSafeEqual } from "crypto";

export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string | null | undefined,
  secret: string,
  tolerance = 300
): boolean {
  if (!signature) return false;

  const parts = signature.split(",").reduce(
    (acc, part) => {
      const [key, value] = part.split("=");
      if (key && value) acc[key] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  const timestamp = parts["t"];
  const sig = parts["v1"];

  if (!timestamp || !sig) return false;

  const timestampNum = parseInt(timestamp, 10);
  if (isNaN(timestampNum)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestampNum) > tolerance) return false;

  const payloadStr = typeof payload === "string" ? payload : payload.toString("utf8");
  const signedPayload = `${timestamp}.${payloadStr}`;
  const expectedSig = createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
  } catch {
    return false;
  }
}
