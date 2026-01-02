import { describe, it, expect, vi, beforeEach } from "vitest";
import { ZentlaClient, ZentlaError } from "../client";

describe("ZentlaClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should create client with default config", () => {
    const client = new ZentlaClient({ apiKey: "test_key" });
    expect(client).toBeInstanceOf(ZentlaClient);
  });

  it("should create client with custom baseUrl", () => {
    const client = new ZentlaClient({
      apiKey: "test_key",
      baseUrl: "https://custom.api.com/v1",
    });
    expect(client).toBeInstanceOf(ZentlaClient);
  });

  describe("customers", () => {
    it("should list customers", async () => {
      const mockResponse = {
        data: [{ id: "cust_123", email: "test@example.com" }],
        hasMore: false,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });
      const result = await client.customers.list();

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/customers"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer test_key",
          }),
        })
      );
    });

    it("should get customer by id", async () => {
      const mockCustomer = { id: "cust_123", email: "test@example.com" };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockCustomer }),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });
      const result = await client.customers.get("cust_123");

      expect(result).toEqual(mockCustomer);
    });

    it("should create customer", async () => {
      const mockCustomer = { id: "cust_123", email: "new@example.com" };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockCustomer }),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });
      const result = await client.customers.create({ email: "new@example.com" });

      expect(result).toEqual(mockCustomer);
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "new@example.com" }),
        })
      );
    });
  });

  describe("error handling", () => {
    it("should throw ZentlaError on API error", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: "Customer not found", code: "NOT_FOUND" }),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });

      await expect(client.customers.get("invalid")).rejects.toThrow(ZentlaError);
      await expect(client.customers.get("invalid")).rejects.toMatchObject({
        status: 404,
        code: "NOT_FOUND",
      });
    });

    it("should retry on 5xx errors", async () => {
      let attempts = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ message: "Server error" }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { id: "cust_123" } }),
        });
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 3 });
      const result = await client.customers.get("cust_123");

      expect(result).toEqual({ id: "cust_123" });
      expect(attempts).toBe(3);
    });

    it("should not retry on 4xx errors", async () => {
      let attempts = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        attempts++;
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ message: "Bad request" }),
        });
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 3 });

      await expect(client.customers.get("cust_123")).rejects.toThrow();
      expect(attempts).toBe(1);
    });
  });

  describe("subscriptions", () => {
    it("should cancel subscription", async () => {
      const mockSub = { id: "sub_123", status: "canceled" };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockSub }),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });
      const result = await client.subscriptions.cancel("sub_123", {
        cancelAtPeriodEnd: true,
      });

      expect(result.status).toBe("canceled");
    });
  });

  describe("checkout", () => {
    it("should create checkout session", async () => {
      const mockCheckout = { id: "ch_123", sessionUrl: "https://checkout.stripe.com/..." };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockCheckout }),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });
      const result = await client.checkout.createSession({
        offerId: "offer_123",
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      });

      expect(result.sessionUrl).toBeDefined();
    });
  });
});
