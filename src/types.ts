export interface Offer {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  status: "active" | "archived";
  currentVersionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfferVersion {
  id: string;
  offerId: string;
  version: number;
  status: "draft" | "published" | "archived";
  config: OfferConfig;
  publishedAt?: string;
  createdAt: string;
}

export interface OfferConfig {
  pricing: PricingConfig;
  trial?: TrialConfig;
  entitlements: EntitlementConfig[];
  metadata?: Record<string, unknown>;
  rawJson?: Record<string, unknown>;
}

export interface PricingConfig {
  model: "flat" | "per_unit" | "tiered" | "volume";
  currency: string;
  amount: number;
  interval?: "day" | "week" | "month" | "year";
  intervalCount?: number;
  usageType?: "licensed" | "metered";
  tiers?: PricingTier[];
}

export interface PricingTier {
  upTo: number | null;
  unitAmount: number;
  flatAmount?: number;
}

export interface TrialConfig {
  days: number;
  requirePaymentMethod: boolean;
}

export interface EntitlementConfig {
  featureKey: string;
  value: string | number | boolean;
  valueType: "boolean" | "number" | "string" | "unlimited";
}

export interface Customer {
  id: string;
  workspaceId: string;
  email: string;
  name?: string;
  externalId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  workspaceId: string;
  customerId: string;
  offerId: string;
  offerVersionId: string;
  status:
    | "trialing"
    | "active"
    | "payment_failed"
    | "canceled"
    | "suspended"
    | "pending"
    | "expired"
    | "paused";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAt?: string;
  canceledAt?: string;
  endedAt?: string;
  trialStart?: string;
  trialEnd?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Checkout {
  id: string;
  workspaceId: string;
  customerId?: string;
  offerId: string;
  offerVersionId: string;
  status: "pending" | "open" | "complete" | "expired";
  sessionUrl?: string;
  successUrl: string;
  cancelUrl: string;
  expiresAt: string;
  completedAt?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEndpoint {
  id: string;
  workspaceId: string;
  url: string;
  events: string[];
  status: "active" | "disabled";
  description?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface EntitlementCheck {
  featureKey: string;
  hasAccess: boolean;
  value?: string | number | boolean;
  valueType?: "boolean" | "number" | "string" | "unlimited";
}

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  nextCursor?: string;
}

// Input types
export interface CreateOfferInput {
  name: string;
  description?: string;
  config: OfferConfig;
}

export interface CreateCustomerInput {
  email: string;
  name?: string;
  externalId?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateCheckoutInput {
  offerId: string;
  offerVersionId?: string;
  customerId?: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  allowPromotionCodes?: boolean;
  trialDays?: number;
  metadata?: Record<string, unknown>;
}

export interface CreateWebhookEndpointInput {
  url: string;
  events: string[];
  description?: string;
  metadata?: Record<string, unknown>;
}

// Usage Metering Types
export interface UsageEvent {
  id: string;
  workspaceId: string;
  customerId: string;
  subscriptionId?: string;
  metricKey: string;
  quantity: number;
  timestamp: string;
  idempotencyKey?: string;
  properties?: Record<string, unknown>;
  createdAt: string;
}

export interface UsageMetric {
  id: string;
  workspaceId: string;
  key: string;
  name: string;
  description?: string;
  unit?: string;
  aggregation: "sum" | "max" | "count" | "last";
  createdAt: string;
  updatedAt: string;
}

export interface UsageSummary {
  metricKey: string;
  totalQuantity: number;
  eventCount: number;
  periodStart: string;
  periodEnd: string;
}

export interface IngestEventInput {
  customerId: string;
  subscriptionId?: string;
  metricKey: string;
  quantity: number;
  timestamp?: string;
  idempotencyKey?: string;
  properties?: Record<string, unknown>;
}

export interface IngestEventResult {
  id: string;
  deduplicated: boolean;
}

export interface IngestBatchResult {
  ingested: number;
  deduplicated: number;
}

export interface CreateMetricInput {
  key: string;
  name: string;
  description?: string;
  unit?: string;
  aggregation?: "sum" | "max" | "count" | "last";
}

// Promotion Types
export interface Promotion {
  id: string;
  workspaceId: string;
  code: string;
  name: string;
  description?: string;
  status: "active" | "archived";
  currentVersionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionVersion {
  id: string;
  promotionId: string;
  version: number;
  status: "draft" | "published" | "archived";
  config: PromotionConfig;
  publishedAt?: string;
  createdAt: string;
}

export interface PromotionConfig {
  discountType: "percent" | "fixed_amount" | "free_trial_days";
  discountValue: number;
  currency?: string;
  duration?: "once" | "repeating" | "forever";
  durationInMonths?: number;
  maxRedemptions?: number;
  maxRedemptionsPerCustomer?: number;
  minimumAmount?: number;
  validFrom?: string;
  validUntil?: string;
  applicableOfferIds?: string[];
}

export interface CreatePromotionInput {
  code: string;
  name: string;
  description?: string;
  config: PromotionConfig;
}

export interface ValidatePromotionResult {
  valid: boolean;
  promotion?: Promotion;
  discountPreview?: {
    type: "percent" | "fixed_amount" | "free_trial_days";
    value: number;
    calculatedAmount?: number;
  };
  invalidReason?: string;
}
