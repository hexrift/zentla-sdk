import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHmac } from "crypto";
import { verifyWebhookSignature } from "../webhooks";

function generateSignature(payload: string, secret: string, timestamp?: number): string {
  const ts = timestamp ?? Math.floor(Date.now() / 1000);
  const signedPayload = `${ts}.${payload}`;
  const sig = createHmac("sha256", secret).update(signedPayload).digest("hex");
  return `t=${ts},v1=${sig}`;
}

describe("verifyWebhookSignature", () => {
  const secret = "whsec_test_secret";
  const payload = JSON.stringify({ event: "subscription.created", data: {} });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should verify valid signature", () => {
    const signature = generateSignature(payload, secret);
    expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
  });

  it("should reject invalid signature", () => {
    const signature = generateSignature(payload, "wrong_secret");
    expect(verifyWebhookSignature(payload, signature, secret)).toBe(false);
  });

  it("should reject missing signature", () => {
    expect(verifyWebhookSignature(payload, null, secret)).toBe(false);
    expect(verifyWebhookSignature(payload, undefined, secret)).toBe(false);
    expect(verifyWebhookSignature(payload, "", secret)).toBe(false);
  });

  it("should reject malformed signature", () => {
    expect(verifyWebhookSignature(payload, "invalid", secret)).toBe(false);
    expect(verifyWebhookSignature(payload, "t=123", secret)).toBe(false);
    expect(verifyWebhookSignature(payload, "v1=abc", secret)).toBe(false);
  });

  it("should reject expired signature", () => {
    const oldTimestamp = Math.floor(Date.now() / 1000) - 400;
    const signature = generateSignature(payload, secret, oldTimestamp);
    expect(verifyWebhookSignature(payload, signature, secret)).toBe(false);
  });

  it("should accept signature within tolerance", () => {
    const recentTimestamp = Math.floor(Date.now() / 1000) - 200;
    const signature = generateSignature(payload, secret, recentTimestamp);
    expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
  });

  it("should handle Buffer payload", () => {
    const bufferPayload = Buffer.from(payload);
    const signature = generateSignature(payload, secret);
    expect(verifyWebhookSignature(bufferPayload, signature, secret)).toBe(true);
  });

  it("should use custom tolerance", () => {
    const oldTimestamp = Math.floor(Date.now() / 1000) - 400;
    const signature = generateSignature(payload, secret, oldTimestamp);
    expect(verifyWebhookSignature(payload, signature, secret, 500)).toBe(true);
  });
});
