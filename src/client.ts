import type {
  Offer,
  OfferVersion,
  Customer,
  Subscription,
  Checkout,
  CheckoutQuote,
  CheckoutIntent,
  WebhookEndpoint,
  EntitlementCheck,
  PaginatedResponse,
  CreateOfferInput,
  CreateCustomerInput,
  CreateCheckoutInput,
  CreateQuoteInput,
  CreateIntentInput,
  CreateWebhookEndpointInput,
  UsageEvent,
  UsageMetric,
  UsageSummary,
  IngestEventInput,
  IngestEventResult,
  IngestBatchResult,
  CreateMetricInput,
  Promotion,
  PromotionVersion,
  CreatePromotionInput,
  ValidatePromotionResult,
} from "./types";

export interface ZentlaClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export class ZentlaClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retries: number;

  constructor(config: ZentlaClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? "https://api.zentla.dev/api/v1";
    this.timeout = config.timeout ?? 30000;
    this.retries = config.retries ?? 3;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    return this.requestWithHeaders(method, path, body);
  }

  private async requestWithHeaders<T>(
    method: string,
    path: string,
    body?: unknown,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.baseUrl}${path}`, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
            ...extraHeaders,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = (await response.json().catch(() => ({}))) as {
            message?: string;
            code?: string;
          };
          throw new ZentlaError(
            error.message ?? `HTTP ${response.status}`,
            response.status,
            error.code,
          );
        }

        const json = await response.json();
        if ("hasMore" in json) return json as T;
        return (json as { data?: T }).data ?? (json as T);
      } catch (err) {
        lastError = err as Error;
        const isRetryable =
          err instanceof ZentlaError
            ? err.status >= 500 || err.status === 429
            : (err as Error).name === "AbortError";

        if (!isRetryable || attempt === this.retries) throw err;

        await new Promise((r) =>
          setTimeout(r, Math.min(1000 * 2 ** attempt, 10000))
        );
      }
    }

    throw lastError;
  }

  // Offers
  readonly offers = {
    list: (params?: {
      limit?: number;
      cursor?: string;
      status?: "active" | "archived";
    }): Promise<PaginatedResponse<Offer>> => {
      const query = new URLSearchParams();
      if (params?.limit) query.set("limit", params.limit.toString());
      if (params?.cursor) query.set("cursor", params.cursor);
      if (params?.status) query.set("status", params.status);
      return this.request("GET", `/offers?${query}`);
    },

    get: (id: string): Promise<Offer & { versions: OfferVersion[] }> =>
      this.request("GET", `/offers/${id}`),

    create: (input: CreateOfferInput): Promise<Offer> =>
      this.request("POST", "/offers", input),

    publish: (id: string, versionId?: string): Promise<OfferVersion> =>
      this.request("POST", `/offers/${id}/publish`, { versionId }),

    createVersion: (
      id: string,
      config: CreateOfferInput["config"],
    ): Promise<OfferVersion> =>
      this.request("POST", `/offers/${id}/versions`, { config }),

    archive: (id: string): Promise<Offer> =>
      this.request("POST", `/offers/${id}/archive`),
  };

  // Customers
  readonly customers = {
    list: (params?: {
      limit?: number;
      cursor?: string;
      email?: string;
    }): Promise<PaginatedResponse<Customer>> => {
      const query = new URLSearchParams();
      if (params?.limit) query.set("limit", params.limit.toString());
      if (params?.cursor) query.set("cursor", params.cursor);
      if (params?.email) query.set("email", params.email);
      return this.request("GET", `/customers?${query}`);
    },

    get: (id: string): Promise<Customer> =>
      this.request("GET", `/customers/${id}`),

    create: (input: CreateCustomerInput): Promise<Customer> =>
      this.request("POST", "/customers", input),

    update: (
      id: string,
      input: Partial<CreateCustomerInput>,
    ): Promise<Customer> => this.request("PATCH", `/customers/${id}`, input),

    getEntitlements: (
      id: string,
    ): Promise<{
      customerId: string;
      entitlements: EntitlementCheck[];
      activeSubscriptionIds: string[];
    }> => this.request("GET", `/customers/${id}/entitlements`),

    checkEntitlement: (
      id: string,
      featureKey: string,
    ): Promise<EntitlementCheck> =>
      this.request("GET", `/customers/${id}/entitlements/check/${featureKey}`),
  };

  // Subscriptions
  readonly subscriptions = {
    list: (params?: {
      limit?: number;
      cursor?: string;
      customerId?: string;
      status?: string;
    }): Promise<PaginatedResponse<Subscription>> => {
      const query = new URLSearchParams();
      if (params?.limit) query.set("limit", params.limit.toString());
      if (params?.cursor) query.set("cursor", params.cursor);
      if (params?.customerId) query.set("customerId", params.customerId);
      if (params?.status) query.set("status", params.status);
      return this.request("GET", `/subscriptions?${query}`);
    },

    get: (id: string): Promise<Subscription> =>
      this.request("GET", `/subscriptions/${id}`),

    cancel: (
      id: string,
      params?: { cancelAtPeriodEnd?: boolean; reason?: string },
    ): Promise<Subscription> =>
      this.request("POST", `/subscriptions/${id}/cancel`, params),

    change: (
      id: string,
      params: {
        newOfferId: string;
        newOfferVersionId?: string;
        prorationBehavior?: "create_prorations" | "none" | "always_invoice";
      },
    ): Promise<Subscription> =>
      this.request("POST", `/subscriptions/${id}/change`, params),
  };

  // Checkout
  readonly checkout = {
    // Hosted checkout sessions
    createSession: (input: CreateCheckoutInput): Promise<Checkout> =>
      this.request("POST", "/checkout/sessions", input),

    getSession: (id: string): Promise<Checkout> =>
      this.request("GET", `/checkout/sessions/${id}`),

    listSessions: (params?: {
      limit?: number;
      cursor?: string;
      status?: "pending" | "completed" | "expired";
    }): Promise<PaginatedResponse<Checkout>> => {
      const query = new URLSearchParams();
      if (params?.limit) query.set("limit", params.limit.toString());
      if (params?.cursor) query.set("cursor", params.cursor);
      if (params?.status) query.set("status", params.status);
      return this.request("GET", `/checkout/sessions?${query}`);
    },

    // Headless checkout - quotes
    createQuote: (input: CreateQuoteInput): Promise<CheckoutQuote> =>
      this.request("POST", "/checkout/quotes", input),

    // Headless checkout - intents
    createIntent: (
      input: CreateIntentInput,
      idempotencyKey?: string,
    ): Promise<CheckoutIntent> =>
      this.requestWithHeaders("POST", "/checkout/intents", input, {
        ...(idempotencyKey && { "Idempotency-Key": idempotencyKey }),
      }),

    getIntent: (id: string): Promise<CheckoutIntent> =>
      this.request("GET", `/checkout/intents/${id}`),

    listIntents: (params?: {
      limit?: number;
      cursor?: string;
      status?:
        | "pending"
        | "processing"
        | "requires_action"
        | "succeeded"
        | "failed"
        | "expired";
    }): Promise<PaginatedResponse<CheckoutIntent>> => {
      const query = new URLSearchParams();
      if (params?.limit) query.set("limit", params.limit.toString());
      if (params?.cursor) query.set("cursor", params.cursor);
      if (params?.status) query.set("status", params.status);
      return this.request("GET", `/checkout/intents?${query}`);
    },
  };

  // Webhook Endpoints
  readonly webhooks = {
    list: (params?: {
      limit?: number;
      cursor?: string;
    }): Promise<PaginatedResponse<WebhookEndpoint>> => {
      const query = new URLSearchParams();
      if (params?.limit) query.set("limit", params.limit.toString());
      if (params?.cursor) query.set("cursor", params.cursor);
      return this.request("GET", `/webhook-endpoints?${query}`);
    },

    create: (input: CreateWebhookEndpointInput): Promise<WebhookEndpoint> =>
      this.request("POST", "/webhook-endpoints", input),

    update: (
      id: string,
      input: Partial<CreateWebhookEndpointInput>,
    ): Promise<WebhookEndpoint> =>
      this.request("PATCH", `/webhook-endpoints/${id}`, input),

    delete: (id: string): Promise<void> =>
      this.request("DELETE", `/webhook-endpoints/${id}`),

    rotateSecret: (id: string): Promise<{ secret: string }> =>
      this.request("POST", `/webhook-endpoints/${id}/rotate-secret`),
  };

  // Usage Metering
  readonly usage = {
    ingest: (input: IngestEventInput): Promise<IngestEventResult> =>
      this.request("POST", "/usage/events", input),

    ingestBatch: (events: IngestEventInput[]): Promise<IngestBatchResult> =>
      this.request("POST", "/usage/events/batch", { events }),

    listEvents: (params?: {
      customerId?: string;
      subscriptionId?: string;
      metricKey?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      cursor?: string;
    }): Promise<PaginatedResponse<UsageEvent>> => {
      const query = new URLSearchParams();
      if (params?.customerId) query.set("customerId", params.customerId);
      if (params?.subscriptionId)
        query.set("subscriptionId", params.subscriptionId);
      if (params?.metricKey) query.set("metricKey", params.metricKey);
      if (params?.startDate) query.set("startDate", params.startDate);
      if (params?.endDate) query.set("endDate", params.endDate);
      if (params?.limit) query.set("limit", params.limit.toString());
      if (params?.cursor) query.set("cursor", params.cursor);
      return this.request("GET", `/usage/events?${query}`);
    },

    getSummary: (
      customerId: string,
      metricKey: string,
      periodStart: string,
      periodEnd: string,
    ): Promise<UsageSummary> => {
      const query = new URLSearchParams({
        periodStart,
        periodEnd,
      });
      return this.request(
        "GET",
        `/usage/summary/${customerId}/${metricKey}?${query}`,
      );
    },

    getCurrentPeriodUsage: (
      subscriptionId: string,
      metricKey: string,
    ): Promise<UsageSummary> =>
      this.request(
        "GET",
        `/usage/subscriptions/${subscriptionId}/current/${metricKey}`,
      ),

    createMetric: (input: CreateMetricInput): Promise<UsageMetric> =>
      this.request("POST", "/usage/metrics", input),

    listMetrics: (): Promise<UsageMetric[]> =>
      this.request("GET", "/usage/metrics"),
  };

  // Promotions
  readonly promotions = {
    list: (params?: {
      limit?: number;
      cursor?: string;
      status?: "active" | "archived";
      search?: string;
    }): Promise<PaginatedResponse<Promotion>> => {
      const query = new URLSearchParams();
      if (params?.limit) query.set("limit", params.limit.toString());
      if (params?.cursor) query.set("cursor", params.cursor);
      if (params?.status) query.set("status", params.status);
      if (params?.search) query.set("search", params.search);
      return this.request("GET", `/promotions?${query}`);
    },

    get: (id: string): Promise<Promotion & { versions: PromotionVersion[] }> =>
      this.request("GET", `/promotions/${id}`),

    create: (input: CreatePromotionInput): Promise<Promotion> =>
      this.request("POST", "/promotions", input),

    update: (
      id: string,
      input: { name?: string; description?: string },
    ): Promise<Promotion> => this.request("PATCH", `/promotions/${id}`, input),

    archive: (id: string): Promise<Promotion> =>
      this.request("POST", `/promotions/${id}/archive`),

    getVersions: (id: string): Promise<PromotionVersion[]> =>
      this.request("GET", `/promotions/${id}/versions`),

    createVersion: (
      id: string,
      config: CreatePromotionInput["config"],
    ): Promise<PromotionVersion> =>
      this.request("POST", `/promotions/${id}/versions`, { config }),

    publish: (id: string, versionId?: string): Promise<Promotion> =>
      this.request("POST", `/promotions/${id}/publish`, { versionId }),

    validate: (
      code: string,
      offerId?: string,
      customerId?: string,
      orderAmount?: number,
    ): Promise<ValidatePromotionResult> =>
      this.request("POST", "/promotions/validate", {
        code,
        offerId,
        customerId,
        orderAmount,
      }),

    getUsage: (
      id: string,
    ): Promise<{
      promotionId: string;
      redemptionCount: number;
      totalDiscountAmount: number;
    }> => this.request("GET", `/promotions/${id}/usage`),
  };
}

export class ZentlaError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ZentlaError";
  }
}
