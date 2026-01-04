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
      const mockCheckout = { id: "ch_123", sessionUrl: "https://checkout.example.com/session/..." };

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

  describe("usage", () => {
    it("should ingest usage event", async () => {
      const mockResult = { id: "evt_123", deduplicated: false };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockResult }),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });
      const result = await client.usage.ingest({
        customerId: "cust_123",
        metricKey: "api_calls",
        quantity: 1,
      });

      expect(result).toEqual(mockResult);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/usage/events"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            customerId: "cust_123",
            metricKey: "api_calls",
            quantity: 1,
          }),
        })
      );
    });

    it("should ingest batch of usage events", async () => {
      const mockResult = { ingested: 2, deduplicated: 0 };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockResult }),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });
      const result = await client.usage.ingestBatch([
        { customerId: "cust_123", metricKey: "api_calls", quantity: 100 },
        { customerId: "cust_456", metricKey: "storage_gb", quantity: 5 },
      ]);

      expect(result).toEqual(mockResult);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/usage/events/batch"),
        expect.objectContaining({ method: "POST" })
      );
    });

    it("should list usage events", async () => {
      const mockResponse = {
        data: [{ id: "evt_123", metricKey: "api_calls", quantity: 1 }],
        hasMore: false,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });
      const result = await client.usage.listEvents({ customerId: "cust_123" });

      expect(result).toEqual(mockResponse);
    });

    it("should get usage summary", async () => {
      const mockSummary = {
        metricKey: "api_calls",
        totalQuantity: 1500,
        eventCount: 150,
        periodStart: "2024-01-01T00:00:00Z",
        periodEnd: "2024-01-31T23:59:59Z",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockSummary }),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });
      const result = await client.usage.getSummary(
        "cust_123",
        "api_calls",
        "2024-01-01T00:00:00Z",
        "2024-01-31T23:59:59Z"
      );

      expect(result).toEqual(mockSummary);
    });

    it("should get current period usage", async () => {
      const mockUsage = {
        metricKey: "api_calls",
        totalQuantity: 500,
        eventCount: 50,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockUsage }),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });
      const result = await client.usage.getCurrentPeriodUsage("sub_123", "api_calls");

      expect(result).toEqual(mockUsage);
    });

    it("should create usage metric", async () => {
      const mockMetric = {
        id: "metric_123",
        key: "api_calls",
        name: "API Calls",
        aggregation: "sum",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockMetric }),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });
      const result = await client.usage.createMetric({
        key: "api_calls",
        name: "API Calls",
        aggregation: "sum",
      });

      expect(result).toEqual(mockMetric);
    });

    it("should list usage metrics", async () => {
      const mockMetrics = [{ id: "metric_123", key: "api_calls", name: "API Calls" }];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockMetrics }),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });
      const result = await client.usage.listMetrics();

      expect(result).toEqual(mockMetrics);
    });
  });

  describe("webhooks", () => {
    it("should create webhook endpoint", async () => {
      const mockWebhook = { id: "wh_123", url: "https://example.com/webhook" };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockWebhook }),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });
      const result = await client.webhooks.create({
        url: "https://example.com/webhook",
        events: ["subscription.created"],
      });

      expect(result).toEqual(mockWebhook);
    });

    it("should update webhook endpoint", async () => {
      const mockWebhook = { id: "wh_123", url: "https://example.com/new-webhook" };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockWebhook }),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });
      const result = await client.webhooks.update("wh_123", {
        url: "https://example.com/new-webhook",
      });

      expect(result.url).toBe("https://example.com/new-webhook");
    });

    it("should delete webhook endpoint", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });
      await client.webhooks.delete("wh_123");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/webhook-endpoints/wh_123"),
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("should rotate webhook secret", async () => {
      const mockResult = { secret: "whsec_new_secret" };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockResult }),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });
      const result = await client.webhooks.rotateSecret("wh_123");

      expect(result.secret).toBe("whsec_new_secret");
    });
  });

  describe("promotions", () => {
    it("should list promotions", async () => {
      const mockResponse = {
        data: [{ id: "promo_123", code: "SUMMER25", status: "active" }],
        hasMore: false,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });
      const result = await client.promotions.list();

      expect(result).toEqual(mockResponse);
    });

    it("should get promotion by id", async () => {
      const mockPromo = {
        id: "promo_123",
        code: "SUMMER25",
        versions: [{ id: "v1", version: 1 }],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockPromo }),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });
      const result = await client.promotions.get("promo_123");

      expect(result).toEqual(mockPromo);
    });

    it("should create promotion", async () => {
      const mockPromo = { id: "promo_123", code: "SUMMER25", name: "Summer Sale" };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockPromo }),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });
      const result = await client.promotions.create({
        code: "SUMMER25",
        name: "Summer Sale",
        config: { discountType: "percent", discountValue: 25 },
      });

      expect(result).toEqual(mockPromo);
    });

    it("should update promotion", async () => {
      const mockPromo = { id: "promo_123", name: "Updated Name" };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockPromo }),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });
      const result = await client.promotions.update("promo_123", { name: "Updated Name" });

      expect(result.name).toBe("Updated Name");
    });

    it("should archive promotion", async () => {
      const mockPromo = { id: "promo_123", status: "archived" };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockPromo }),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });
      const result = await client.promotions.archive("promo_123");

      expect(result.status).toBe("archived");
    });

    it("should get promotion versions", async () => {
      const mockVersions = [{ id: "v1", version: 1, status: "published" }];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockVersions }),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });
      const result = await client.promotions.getVersions("promo_123");

      expect(result).toEqual(mockVersions);
    });

    it("should create promotion version", async () => {
      const mockVersion = { id: "v2", version: 2, status: "draft" };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockVersion }),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });
      const result = await client.promotions.createVersion("promo_123", {
        discountType: "percent",
        discountValue: 30,
      });

      expect(result).toEqual(mockVersion);
    });

    it("should publish promotion", async () => {
      const mockPromo = { id: "promo_123", currentVersionId: "v1" };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockPromo }),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });
      const result = await client.promotions.publish("promo_123");

      expect(result.currentVersionId).toBe("v1");
    });

    it("should validate promotion code", async () => {
      const mockResult = {
        valid: true,
        promotion: { id: "promo_123", code: "SUMMER25" },
        discountPreview: { type: "percent", value: 25, calculatedAmount: 2500 },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockResult }),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });
      const result = await client.promotions.validate("SUMMER25", "offer_123");

      expect(result.valid).toBe(true);
      expect(result.discountPreview?.value).toBe(25);
    });

    it("should get promotion usage", async () => {
      const mockUsage = {
        promotionId: "promo_123",
        redemptionCount: 47,
        totalDiscountAmount: 235000,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockUsage }),
      });

      const client = new ZentlaClient({ apiKey: "test_key", retries: 0 });
      const result = await client.promotions.getUsage("promo_123");

      expect(result.redemptionCount).toBe(47);
    });
  });
});
